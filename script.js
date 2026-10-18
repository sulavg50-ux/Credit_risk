const form = document.querySelector("#assessment-form");
const submitButton = document.querySelector("#submit-button");
const resultCard = document.querySelector("#result-card");
const errorMessage = document.querySelector("#error-message");
const ratioDisplay = document.querySelector("#loan-percent-income");
const apiBaseUrl = window.CREDIT_RISK_CONFIG?.API_BASE_URL ?? "";

const categoryFields = [
  "person_home_ownership",
  "loan_intent",
  "loan_grade",
  "cb_person_default_on_file",
];

function updateLoanRatio() {
  const income = Number(form.elements.person_income.value);
  const amount = Number(form.elements.loan_amnt.value);
  ratioDisplay.value = income > 0 && amount > 0
    ? `${((amount / income) * 100).toFixed(1)}%`
    : "Enter income and loan amount";
}

function populateSelect(select, values) {
  select.replaceChildren(new Option("Select an option", ""));
  for (const value of values) {
    select.add(new Option(value, value));
  }
  select.disabled = false;
}

async function loadOptions() {
  const response = await fetch(`${apiBaseUrl}/api/options`);
  if (!response.ok) {
    throw new Error("Could not load the model's form options.");
  }

  const { categorical_values: options } = await response.json();
  for (const field of categoryFields) {
    const select = form.elements[field];
    const values = options[field];
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error(`No options are configured for ${field}.`);
    }
    populateSelect(select, values);
  }
  submitButton.disabled = false;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function showResult(result) {
  const isHigherRisk = result.default_prediction === 1;
  const probability = Math.min(1, Math.max(0, result.default_probability));

  resultCard.classList.toggle("is-high-risk", isHigherRisk);
  document.querySelector("#result-title").textContent = result.risk_label;
  document.querySelector("#result-description").textContent = isHigherRisk
    ? "The model estimates an elevated likelihood of default for this profile."
    : "The model estimates a lower likelihood of default for this profile.";
  document.querySelector("#probability-value").textContent =
    new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(probability);
  document.querySelector("#probability-bar").style.width = `${probability * 100}%`;
  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.elements.person_income.addEventListener("input", updateLoanRatio);
form.elements.loan_amnt.addEventListener("input", updateLoanRatio);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  resultCard.hidden = true;
  submitButton.disabled = true;
  submitButton.classList.add("is-loading");
  submitButton.querySelector("span:first-child").textContent = "Assessing…";

  const formValues = Object.fromEntries(new FormData(form).entries());
  const payload = Object.fromEntries(
    Object.entries(formValues).map(([key, value]) => [key, value.trim()]),
  );
  for (const field of [
    "person_age",
    "person_income",
    "person_emp_length",
    "loan_amnt",
    "loan_int_rate",
    "cb_person_cred_hist_length",
  ]) {
    payload[field] = Number(payload[field]);
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(typeof data.detail === "string" ? data.detail : "Please check the details and try again.");
    }
    showResult(data);
  } catch (error) {
    showError(error instanceof Error ? error.message : "The assessment could not be completed.");
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("is-loading");
    submitButton.querySelector("span:first-child").textContent = "Assess risk";
  }
});

loadOptions().catch((error) => {
  showError(error instanceof Error ? error.message : "Could not connect to the API.");
});