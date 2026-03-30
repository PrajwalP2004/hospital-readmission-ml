import os
import sys
import json
import joblib
import pandas as pd
from sklearn.metrics import confusion_matrix

sys.path.append(r"c:\Users\prajwal pahuja\Desktop\hospital-readmission-ml-main")
from ml.train_model import load_and_reconstruct, TARGET

def main():
    base_dir = r"c:\Users\prajwal pahuja\Desktop\hospital-readmission-ml-main\ml"
    data_path = os.path.join(base_dir, "..", "data", "train.csv")
    pipeline_path = os.path.join(base_dir, "artifacts", "full_pipeline.joblib")
    meta_path = os.path.join(base_dir, "artifacts", "pipeline_meta.json")

    with open(meta_path, "r") as f:
        meta = json.load(f)
    threshold = meta.get("threshold", 0.5)

    pipeline = joblib.load(pipeline_path)
    df = load_and_reconstruct(data_path)
    
    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    y_prob = pipeline.predict_proba(X)[:, 1]
    y_pred = (y_prob >= threshold).astype(int)

    cm = confusion_matrix(y, y_pred)
    print("CONFUSION_MATRIX_OUTPUT")
    print(json.dumps(cm.tolist()))

if __name__ == "__main__":
    main()
