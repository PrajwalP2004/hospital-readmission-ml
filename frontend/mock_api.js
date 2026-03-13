/**
 * mock_api.js
 * Simulates backend responses for the Clinical Decision Support Dashboard.
 * All functions return Promises with a simulated network delay.
 */

const SIMULATED_DELAY_MS = 400;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── ICD-10 Diagnosis Categories ────────────────────────────────────────────

const DIAGNOSIS_CATEGORIES = [
  // Cardiac
  { id: "I50",  label: "Heart Failure",                      code: "I50",  type: "cardiac",       group: "Cardiac" },
  { id: "I21",  label: "Acute Myocardial Infarction",        code: "I21",  type: "cardiac",       group: "Cardiac" },
  { id: "I25",  label: "Chronic Ischemic Heart Disease",     code: "I25",  type: "cardiac",       group: "Cardiac" },
  { id: "I48",  label: "Atrial Fibrillation",                code: "I48",  type: "cardiac",       group: "Cardiac" },
  { id: "I10",  label: "Essential Hypertension",             code: "I10",  type: "cardiac",       group: "Cardiac" },

  // Orthopedic
  { id: "Z96",  label: "Hip Replacement",                    code: "Z96",  type: "orthopedic",    group: "Orthopedic" },
  { id: "M17",  label: "Knee Osteoarthritis",                code: "M17",  type: "orthopedic",    group: "Orthopedic" },
  { id: "S72",  label: "Fracture of Femur",                  code: "S72",  type: "orthopedic",    group: "Orthopedic" },
  { id: "M54",  label: "Dorsalgia / Back Pain",              code: "M54",  type: "orthopedic",    group: "Orthopedic" },
  { id: "M16",  label: "Coxarthrosis (Hip Osteoarthritis)",  code: "M16",  type: "orthopedic",    group: "Orthopedic" },

  // Renal
  { id: "N18",  label: "Chronic Kidney Disease",             code: "N18",  type: "renal",         group: "Renal" },
  { id: "N17",  label: "Acute Kidney Failure",               code: "N17",  type: "renal",         group: "Renal" },
  { id: "N20",  label: "Kidney Stone",                       code: "N20",  type: "renal",         group: "Renal" },

  // Respiratory
  { id: "J44",  label: "COPD",                               code: "J44",  type: "respiratory",   group: "Respiratory" },
  { id: "J18",  label: "Pneumonia",                          code: "J18",  type: "respiratory",   group: "Respiratory" },
  { id: "J45",  label: "Asthma",                             code: "J45",  type: "respiratory",   group: "Respiratory" },
];

// ─── Patient Risk Data ───────────────────────────────────────────────────────

const RISK_DATA = {
  I50:  { score: 82, level: "High",   patientType: "cardiac",     factors: [{ name: "Length of Stay",       value: 88 }, { name: "Prior Admissions",      value: 76 }, { name: "Medication Complexity",  value: 71 }, { name: "Age (76 yrs)",          value: 65 }, { name: "EF < 40%",              value: 60 }, { name: "Comorbidities",         value: 55 }] },
  I21:  { score: 78, level: "High",   patientType: "cardiac",     factors: [{ name: "Infarct Size",         value: 82 }, { name: "Prior MI",              value: 70 }, { name: "Length of Stay",        value: 68 }, { name: "Diabetes",              value: 55 }, { name: "Age (69 yrs)",          value: 50 }, { name: "Hypertension",          value: 44 }] },
  I25:  { score: 58, level: "Medium", patientType: "cardiac",     factors: [{ name: "Prior Admissions",    value: 65 }, { name: "Stent Placement",       value: 58 }, { name: "Medication Adherence",  value: 50 }, { name: "Age (63 yrs)",          value: 44 }, { name: "Smoking History",       value: 40 }, { name: "BMI",                   value: 35 }] },
  I48:  { score: 61, level: "Medium", patientType: "cardiac",     factors: [{ name: "Stroke Risk (CHA₂DS₂)",value:72 }, { name: "Rate Control",          value: 60 }, { name: "Length of Stay",        value: 55 }, { name: "Age (71 yrs)",          value: 52 }, { name: "Prior Cardioversion",   value: 40 }, { name: "Renal Function",        value: 38 }] },
  I10:  { score: 35, level: "Low",    patientType: "cardiac",     factors: [{ name: "Uncontrolled BP",     value: 45 }, { name: "Medication Adherence",  value: 38 }, { name: "Prior Episodes",        value: 32 }, { name: "Age (55 yrs)",          value: 28 }, { name: "Obesity",               value: 22 }, { name: "Stress",                value: 18 }] },
  Z96:  { score: 42, level: "Low",    patientType: "orthopedic",  factors: [{ name: "Length of Stay",       value: 55 }, { name: "PT Compliance",         value: 48 }, { name: "Age (67 yrs)",          value: 42 }, { name: "DVT Risk",              value: 40 }, { name: "Prior Falls",           value: 35 }, { name: "BMI",                   value: 30 }] },
  M17:  { score: 28, level: "Low",    patientType: "orthopedic",  factors: [{ name: "Pain Score",           value: 40 }, { name: "Mobility Impairment",   value: 38 }, { name: "Age (59 yrs)",          value: 30 }, { name: "BMI",                   value: 28 }, { name: "Comorbidities",         value: 22 }, { name: "PT Access",             value: 18 }] },
  S72:  { score: 75, level: "High",   patientType: "orthopedic",  factors: [{ name: "Surgical Complexity",  value: 80 }, { name: "Length of Stay",        value: 75 }, { name: "Age (80 yrs)",          value: 72 }, { name: "DVT Risk",              value: 68 }, { name: "Osteoporosis",          value: 60 }, { name: "Delirium Risk",         value: 55 }] },
  M54:  { score: 22, level: "Low",    patientType: "orthopedic",  factors: [{ name: "Chronic Pain Index",   value: 35 }, { name: "Opioid Use",            value: 28 }, { name: "Work Disability",       value: 25 }, { name: "Depression",            value: 22 }, { name: "Prior Episodes",        value: 18 }, { name: "Age (48 yrs)",          value: 15 }] },
  M16:  { score: 48, level: "Medium", patientType: "orthopedic",  factors: [{ name: "Arthroplasty Urgency", value: 58 }, { name: "Pain Score",            value: 52 }, { name: "Length of Stay",        value: 45 }, { name: "Age (64 yrs)",          value: 40 }, { name: "BMI",                   value: 36 }, { name: "PT Compliance",         value: 30 }] },
  N18:  { score: 68, level: "Medium", patientType: "renal",       factors: [{ name: "GFR Decline Rate",    value: 75 }, { name: "Proteinuria",           value: 68 }, { name: "Dialysis Risk",         value: 62 }, { name: "Hypertension",          value: 55 }, { name: "Diabetes",              value: 50 }, { name: "Age (66 yrs)",          value: 42 }] },
  N17:  { score: 85, level: "High",   patientType: "renal",       factors: [{ name: "Creatinine Level",    value: 90 }, { name: "Urine Output",          value: 85 }, { name: "Length of Stay",        value: 80 }, { name: "Prior CKD",             value: 72 }, { name: "Sepsis Risk",           value: 65 }, { name: "Age (70 yrs)",          value: 55 }] },
  N20:  { score: 30, level: "Low",    patientType: "renal",       factors: [{ name: "Stone Size",           value: 42 }, { name: "Recurrence Risk",       value: 35 }, { name: "Hydration Status",      value: 30 }, { name: "Pain Control",          value: 28 }, { name: "Infection Risk",        value: 22 }, { name: "Age (45 yrs)",          value: 18 }] },
  J44:  { score: 72, level: "High",   patientType: "respiratory", factors: [{ name: "FEV1 Decline",        value: 78 }, { name: "Exacerbation History",  value: 72 }, { name: "Length of Stay",        value: 65 }, { name: "Smoking Pack-Years",    value: 60 }, { name: "O2 Dependency",         value: 58 }, { name: "Age (67 yrs)",          value: 48 }] },
  J18:  { score: 55, level: "Medium", patientType: "respiratory", factors: [{ name: "CURB-65 Score",       value: 65 }, { name: "Length of Stay",        value: 58 }, { name: "Age (60 yrs)",          value: 50 }, { name: "Immunocompromised",     value: 45 }, { name: "Bilateral Infiltrates", value: 40 }, { name: "Prior Pneumonia",       value: 35 }] },
  J45:  { score: 38, level: "Low",    patientType: "respiratory", factors: [{ name: "Exacerbation Freq",   value: 48 }, { name: "Steroid Use",           value: 42 }, { name: "Trigger Exposure",      value: 38 }, { name: "Peak Flow Variability", value: 32 }, { name: "Medication Adherence",  value: 28 }, { name: "Age (34 yrs)",          value: 20 }] },
};

// ─── Suggestions Data ────────────────────────────────────────────────────────

const SUGGESTIONS_DATA = {
  cardiac: {
    color: "#ff4d6d",
    bgColor: "rgba(255, 77, 109, 0.08)",
    borderColor: "rgba(255, 77, 109, 0.25)",
    icon: "Heart",
    title: "Cardiac Care Protocol",
    suggestions: [
      { icon: "Pill",           text: "Review diuretic dosing — titrate furosemide to euvolemia" },
      { icon: "Activity",       text: "Daily weight monitoring; alert on >2 kg gain in 24h" },
      { icon: "HeartPulse",     text: "Cardiology consult within 24h for EF < 35%" },
      { icon: "Utensils",       text: "Sodium restriction < 2g/day; fluid restriction 1.5–2L/day" },
      { icon: "Phone",          text: "Schedule 7-day post-discharge follow-up with cardiologist" },
      { icon: "ClipboardList",  text: "Initiate cardiac rehab referral before discharge" },
    ],
  },
  orthopedic: {
    color: "#38bdf8",
    bgColor: "rgba(56, 189, 248, 0.08)",
    borderColor: "rgba(56, 189, 248, 0.25)",
    icon: "Bone",
    title: "Orthopedic Care Protocol",
    suggestions: [
      { icon: "PersonStanding", text: "Initiate PT within 24h post-op for early mobilization" },
      { icon: "Syringe",        text: "DVT prophylaxis — anticoagulation per protocol (LMWH)" },
      { icon: "ShieldPlus",     text: "Fall risk assessment — bed alarms, non-slip footwear" },
      { icon: "Dumbbell",       text: "Home exercise program education before discharge" },
      { icon: "CalendarCheck",  text: "Orthopedic follow-up at 2 weeks and 6 weeks post-op" },
      { icon: "Bandage",        text: "Wound care education; monitor for signs of infection" },
    ],
  },
  renal: {
    color: "#a78bfa",
    bgColor: "rgba(167, 139, 250, 0.08)",
    borderColor: "rgba(167, 139, 250, 0.25)",
    icon: "Droplets",
    title: "Renal Care Protocol",
    suggestions: [
      { icon: "TestTube",       text: "Daily BMP — monitor creatinine, BUN, potassium trends" },
      { icon: "Droplets",       text: "Strict fluid balance — I&O every 4h, target euvolemia" },
      { icon: "Pill",           text: "Nephrotoxic medication review — avoid NSAIDs, adjust contrast" },
      { icon: "Stethoscope",    text: "Nephrology consult for GFR < 30 or rising creatinine" },
      { icon: "Apple",          text: "Low-potassium, low-phosphorus dietary counselling" },
      { icon: "CalendarCheck",  text: "Outpatient renal function check within 1 week" },
    ],
  },
  respiratory: {
    color: "#34d399",
    bgColor: "rgba(52, 211, 153, 0.08)",
    borderColor: "rgba(52, 211, 153, 0.25)",
    icon: "Wind",
    title: "Respiratory Care Protocol",
    suggestions: [
      { icon: "Wind",           text: "Pulmonary function test and bronchodilator response evaluation" },
      { icon: "Activity",       text: "O2 saturation target 88–92% for COPD (avoid hypercapnia)" },
      { icon: "Pill",           text: "Inhaler technique assessment and education before discharge" },
      { icon: "SmokingNo",      text: "Smoking cessation counselling and NRT prescription" },
      { icon: "CalendarCheck",  text: "Pulmonology follow-up within 30 days" },
      { icon: "Stethoscope",    text: "Initiate pulmonary rehab referral for GOLD Stage III–IV" },
    ],
  },
};

// ─── Mock Patients ───────────────────────────────────────────────────────────

const MOCK_PATIENTS = {
  cardiac:     { name: "Margaret T.", age: 73, ward: "Cardiac ICU",       mrn: "MRN-004821", admitted: "2026-02-24" },
  orthopedic:  { name: "Robert H.",   age: 67, ward: "Orthopedic Wing B", mrn: "MRN-007134", admitted: "2026-02-25" },
  renal:       { name: "Sandra K.",   age: 66, ward: "Nephrology Unit",   mrn: "MRN-002975", admitted: "2026-02-23" },
  respiratory: { name: "James O.",    age: 61, ward: "Respiratory Unit",  mrn: "MRN-009341", admitted: "2026-02-26" },
};

// ─── Public API Functions ────────────────────────────────────────────────────

/**
 * Returns all ICD-10 diagnosis categories grouped by specialty.
 * @returns {Promise<Array>}
 */
export async function getDiagnosisCategories() {
  await delay(SIMULATED_DELAY_MS);
  return DIAGNOSIS_CATEGORIES;
}

/**
 * Returns risk score and contributing factors for a given diagnosis ID.
 * @param {string} diagnosisId - e.g. "I50"
 * @returns {Promise<Object>}
 */
export async function getPatientRisk(diagnosisId) {
  await delay(SIMULATED_DELAY_MS);
  const risk = RISK_DATA[diagnosisId];
  if (!risk) throw new Error(`No risk data for diagnosis: ${diagnosisId}`);
  return { ...risk };
}

/**
 * Returns care suggestions for a given patient type.
 * @param {string} patientType - "cardiac" | "orthopedic" | "renal" | "respiratory"
 * @returns {Promise<Object>}
 */
export async function getSuggestions(patientType) {
  await delay(SIMULATED_DELAY_MS);
  const data = SUGGESTIONS_DATA[patientType];
  if (!data) throw new Error(`No suggestions for patient type: ${patientType}`);
  return { ...data };
}

/**
 * Returns mock patient demographics for a given patient type.
 * @param {string} patientType
 * @returns {Promise<Object>}
 */
export async function getPatientInfo(patientType) {
  await delay(SIMULATED_DELAY_MS);
  return MOCK_PATIENTS[patientType] || MOCK_PATIENTS.cardiac;
}

export default { getDiagnosisCategories, getPatientRisk, getSuggestions, getPatientInfo };
