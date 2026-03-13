import pandas as pd
import json
import os

NUMERICAL_FEATURES = [
    "time_in_hospital", "num_lab_procedures", "num_procedures",
    "num_medications", "number_outpatient", "number_emergency",
    "number_inpatient", "number_diagnoses",
]

OHE_PREFIXES = {
    "race": ["Caucasian", "AfricanAmerican"],
    "gender": ["Female"],
    "age": ["[70-80)", "[60-70)", "[50-60)", "[80-90)", "[40-50)"],
    "payer_code": ["?", "MC", "HM", "SP", "BC"],
    "medical_specialty": ["?", "InternalMedicine", "Emergency/Trauma",
                          "Family/GeneralPractice", "Cardiology"],
    "diag_1": ["428", "414", "786"],
    "diag_2": ["276", "428", "250", "427"],
    "diag_3": ["250", "401", "276", "428"],
    "max_glu_serum": ["None"],
    "A1Cresult": ["None"],
    "metformin": ["No"],
    "repaglinide": ["No"],
    "nateglinide": ["No"],
    "chlorpropamide": ["No"],
    "glimepiride": ["No"],
    "glipizide": ["No"],
    "glyburide": ["No"],
    "tolbutamide": ["No"],
    "pioglitazone": ["No"],
    "rosiglitazone": ["No"],
    "acarbose": ["No"],
    "miglitol": ["No"],
    "troglitazone": ["No"],
    "tolazamide": ["No"],
    "insulin": ["No"],
    "glyburide-metformin": ["No"],
    "glipizide-metformin": ["No"],
    "glimepiride-pioglitazone": ["No"],
    "change": ["No"],
    "diabetesMed": ["Yes"],
}

DATA_PATH = "data/train.csv"

def main():
    if not os.path.exists(DATA_PATH):
        print(f"File not found: {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    
    # Cast bools to int
    bool_cols = df.select_dtypes(include="bool").columns
    df[bool_cols] = df[bool_cols].astype(int)

    patients = []
    
    print(f"  Processing {len(df):,} records...")

    for i, row in df.iterrows():
        # Generic identities for scale
        p = {
            "id": str(i + 1),
            "name": f"Clinical Patient #{i + 101}",
            "mrn": f"MRN-{100000 + i}",
            "admitted": "2026-03-01",
            "riskLevel": "Calculating..." 
        }
        
        # Numbers
        for col in NUMERICAL_FEATURES:
            p[col] = int(row[col])
            
        # Categoricals
        for feat, values in OHE_PREFIXES.items():
            p[feat] = "Other"
            for val in values:
                col = f"{feat}_{val}"
                if col in df.columns and row[col] == 1:
                    p[feat] = val
                    break
        
        patients.append(p)
        if (i + 1) % 5000 == 0:
            print(f"    ... {i + 1} records reconstructed")
    
    with open("extracted_patients.json", "w", encoding="utf-8") as f:
        json.dump(patients, f, indent=2)
    print(f"\n  Successfully extracted {len(patients):,} patients to extracted_patients.json")

if __name__ == "__main__":
    main()
