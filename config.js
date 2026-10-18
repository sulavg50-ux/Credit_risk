// ============================================================================
// Credit Risk Assessment Dashboard — Configuration
// ============================================================================
// Update the values below to match your trained model's encoder artifacts.
// These are loaded from `credit_risk_model.pkl` via:
//   label_encoders = artifacts["label_encoders"]
//   cat_cols       = artifacts["cat_cols"]
//
// To populate the dropdowns with your ACTUAL encoder classes, replace the
// placeholder arrays below with the real `classes_` from each encoder:
//   e.g. label_encoders["loan_grade"].classes_
// ============================================================================

window.CREDIT_RISK_CONFIG = {
  // FastAPI backend URL. Replace with your deployed backend later.
  API_BASE_URL: "",

  // Categorical field dropdown values — sourced from your model's label encoders.
  // Each array must contain the exact string classes the encoder was fitted on.
  categoricalValues: {
    person_home_ownership: [
      "OWN",
      "RENT",
      "MORTGAGE",
      "OTHER"
    ],
    loan_intent: [
      "DEBTCONSOLIDATION",
      "EDUCATION",
      "HOMEIMPROVEMENT",
      "MEDICAL",
      "PERSONAL",
      "VENTURE"
    ],
    loan_grade: [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G"
    ],
    cb_person_default_on_file: [
      "Y",
      "N"
    ]
  }
};