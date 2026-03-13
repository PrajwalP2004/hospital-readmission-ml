import json
import os

MOCK_API_PATH = "src/api/mockApi.js"
FINALIZED_PATH = "finalized_patients.json"

BOILERPLATE_START = """/**
 * mockApi.js
 * Ported data and simulated functions for development and testing.
 */

const SIMULATED_DELAY_MS = 400;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const DIAGNOSIS_CATEGORIES = [
  { id: "I50",  label: "Heart Failure",                      code: "I50",  type: "cardiac",       group: "Cardiac" },
  { id: "I21",  label: "Acute Myocardial Infarction",        code: "I21",  type: "cardiac",       group: "Cardiac" },
  { id: "I25",  label: "Chronic Ischemic Heart Disease",     code: "I25",  type: "cardiac",       group: "Cardiac" },
  { id: "I48",  label: "Atrial Fibrillation",                code: "I48",  type: "cardiac",       group: "Cardiac" },
  { id: "I10",  label: "Essential Hypertension",             code: "I10",  type: "cardiac",       group: "Cardiac" },
  { id: "Z96",  label: "Hip Replacement",                    code: "Z96",  type: "orthopedic",    group: "Orthopedic" },
  { id: "M17",  label: "Knee Osteoarthritis",                code: "M17",  type: "orthopedic",    group: "Orthopedic" },
  { id: "S72",  label: "Fracture of Femur",                  code: "S72",  type: "orthopedic",    group: "Orthopedic" },
  { id: "M54",  label: "Dorsalgia / Back Pain",              code: "M54",  type: "orthopedic",    group: "Orthopedic" },
  { id: "M16",  label: "Coxarthrosis (Hip Osteoarthritis)",  code: "M16",  type: "orthopedic",    group: "Orthopedic" },
  { id: "N18",  label: "Chronic Kidney Disease",             code: "N18",  type: "renal",         group: "Renal" },
  { id: "N17",  label: "Acute Kidney Failure",               code: "N17",  type: "renal",         group: "Renal" },
  { id: "N20",  label: "Kidney Stone",                       code: "N20",  type: "renal",         group: "Renal" },
  { id: "J44",  label: "COPD",                               code: "J44",  type: "respiratory",   group: "Respiratory" },
  { id: "J18",  label: "Pneumonia",                          code: "J18",  type: "respiratory",   group: "Respiratory" },
  { id: "J45",  label: "Asthma",                             code: "J45",  type: "respiratory",   group: "Respiratory" },
];

let MOCK_PATIENTS = """

BOILERPLATE_END = """;

export async function getDiagnosisCategories() {
  await delay(SIMULATED_DELAY_MS);
  return DIAGNOSIS_CATEGORIES;
}

export async function getMockPatients() {
  await delay(SIMULATED_DELAY_MS);
  return [...MOCK_PATIENTS];
}

export async function addMockPatient(patientData) {
  await delay(SIMULATED_DELAY_MS);
  const newPatient = {
    ...patientData,
    id: (MOCK_PATIENTS.length + 1).toString(),
    admitted: new Date().toISOString().split('T')[0]
  };
  MOCK_PATIENTS = [newPatient, ...MOCK_PATIENTS];
  return newPatient;
}

export default { getDiagnosisCategories, getMockPatients, addMockPatient, DIAGNOSIS_CATEGORIES, MOCK_PATIENTS };
"""

def main():
    with open(FINALIZED_PATH, "r", encoding="utf-8") as f:
        patients_json = f.read()
    
    with open(MOCK_API_PATH, "w", encoding="utf-8") as f:
        f.write(BOILERPLATE_START)
        f.write(patients_json)
        f.write(BOILERPLATE_END)
    
    print(f"  Successfully updated {MOCK_API_PATH} with {len(json.loads(patients_json))} records.")

if __name__ == "__main__":
    main()
