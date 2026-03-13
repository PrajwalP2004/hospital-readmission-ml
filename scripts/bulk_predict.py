import joblib
import json
import pandas as pd
import os

ARTIFACTS_DIR = "ml/artifacts"
PIPELINE_PATH = os.path.join(ARTIFACTS_DIR, "full_pipeline.joblib")
META_PATH = os.path.join(ARTIFACTS_DIR, "pipeline_meta.json")

def _risk_level(prob, threshold):
    if prob >= threshold * 1.5: return "High"
    if prob >= threshold: return "Medium"
    return "Low"

def main():
    pipeline = joblib.load(PIPELINE_PATH)
    with open(META_PATH, "r") as f:
        meta = json.load(f)
    
    threshold = meta.get("threshold", 0.5)
    
    with open("extracted_patients.json", "r", encoding="utf-8-sig") as f:
        patients = json.load(f)
    
    # Convert patients list to DF for batch prediction
    # We only need the features that the pipeline expects
    df_input = pd.DataFrame(patients)
    
    # Run prediction
    try:
        y_prob = pipeline.predict_proba(df_input)[:, 1]
    except Exception as e:
        print(f"Prediction failed: {e}")
        return

    for i, p in enumerate(patients):
        prob = float(y_prob[i])
        p["risk_probability"] = round(prob * 100, 1)
        p["riskLevel"] = _risk_level(prob, threshold)
    
    # Save to file
    with open("finalized_patients.json", "w", encoding="utf-8") as f:
        json.dump(patients, f, indent=2)
    print(f"  Success: Finalized {len(patients)} records with risk assessments.")

if __name__ == "__main__":
    main()
