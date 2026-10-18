# Credit Risk API

This project serves a credit-default prediction API and a browser-based form for
the trained `credit_risk_model.pkl` model.

## Run locally

Install the dependencies if they are not already available:

```powershell
python -m pip install fastapi uvicorn pandas scikit-learn
```

Start the API and UI from this directory:

```powershell
python -m uvicorn main:app --reload
```

Open <http://127.0.0.1:8000> for the UI and <http://127.0.0.1:8000/docs>
for the interactive API documentation.

## API

- `GET /health` — reports whether the model loaded.
- `GET /api/options` — returns categorical choices from the model's encoders.
- `POST /api/predict` — accepts the applicant and loan fields and returns the
  predicted default class and probability. The loan-to-income ratio is computed
  by the API from loan amount and annual income.

The result is a model estimate, not a lending decision or financial advice.