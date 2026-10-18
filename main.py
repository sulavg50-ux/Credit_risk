from pathlib import Path
import pickle
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "credit_risk_model.pkl"


def load_artifacts() -> dict[str, Any]:
    if not MODEL_PATH.is_file():
        raise RuntimeError(f"Model file not found: {MODEL_PATH}")

    with MODEL_PATH.open("rb") as model_file:
        artifacts = pickle.load(model_file)

    required_keys = {"model", "scaler", "label_encoders", "num_cols", "cat_cols", "feature_names"}
    missing_keys = required_keys.difference(artifacts)
    if missing_keys:
        raise RuntimeError(f"Model artifact is missing keys: {', '.join(sorted(missing_keys))}")

    return artifacts


artifacts = load_artifacts()
app = FastAPI(
    title="Credit Risk API",
    description="Estimate the probability of loan default using the trained credit-risk model.",
    version="1.0.0",
)


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    person_age: int = Field(gt=0)
    person_income: float = Field(gt=0, allow_inf_nan=False)
    person_home_ownership: str
    person_emp_length: float = Field(ge=0, allow_inf_nan=False)
    loan_intent: str
    loan_grade: str
    loan_amnt: float = Field(gt=0, allow_inf_nan=False)
    loan_int_rate: float = Field(ge=0, allow_inf_nan=False)
    cb_person_default_on_file: str
    cb_person_cred_hist_length: float = Field(ge=0, allow_inf_nan=False)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "model": "loaded"}


@app.get("/api/options")
def get_options() -> dict[str, dict[str, list[str]]]:
    encoders = artifacts["label_encoders"]
    return {
        "categorical_values": {
            column: [str(value) for value in encoder.classes_]
            for column, encoder in encoders.items()
        }
    }


@app.post("/api/predict")
def predict_default_risk(request: PredictionRequest) -> dict[str, int | float | str]:
    values = request.model_dump()
    values["loan_percent_income"] = request.loan_amnt / request.person_income

    for column in artifacts["cat_cols"]:
        encoder = artifacts["label_encoders"][column]
        try:
            values[column] = int(encoder.transform([values[column]])[0])
        except ValueError as error:
            valid_values = ", ".join(str(value) for value in encoder.classes_)
            raise HTTPException(
                status_code=422,
                detail=f"Invalid value for {column}. Choose one of: {valid_values}.",
            ) from error

    features = pd.DataFrame(
        [[values[column] for column in artifacts["feature_names"]]],
        columns=artifacts["feature_names"],
    )
    features[artifacts["num_cols"]] = artifacts["scaler"].transform(
        features[artifacts["num_cols"]]
    )

    model = artifacts["model"]
    prediction = int(model.predict(features)[0])
    default_class_index = list(model.classes_).index(1)
    default_probability = float(model.predict_proba(features)[0][default_class_index])

    return {
        "default_prediction": prediction,
        "risk_label": "Higher default risk" if prediction == 1 else "Lower default risk",
        "default_probability": default_probability,
    }


@app.get("/", include_in_schema=False)
def serve_homepage() -> FileResponse:
    return FileResponse(BASE_DIR / "index.html")


@app.get("/script.js", include_in_schema=False)
def serve_script() -> FileResponse:
    return FileResponse(BASE_DIR / "script.js", media_type="application/javascript")


@app.get("/style.css", include_in_schema=False)
def serve_stylesheet() -> FileResponse:
    return FileResponse(BASE_DIR / "style.css", media_type="text/css")


@app.get("/config.js", include_in_schema=False)
def serve_configuration() -> FileResponse:
    return FileResponse(BASE_DIR / "config.js", media_type="application/javascript")