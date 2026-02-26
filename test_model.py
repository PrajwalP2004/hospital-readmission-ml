"""
test_model.py
End-to-end verification of the production readmission prediction pipeline.
"""

from predict import predict_readmission

SAMPLE_PATIENTS = [
    {
        "name": "High-risk patient (elderly, prior inpatient, many meds)",
        "data": {
            "time_in_hospital": 10, "num_lab_procedures": 70,
            "num_procedures": 3, "num_medications": 25,
            "number_outpatient": 0, "number_emergency": 2,
            "number_inpatient": 3, "number_diagnoses": 9,
            "race": "Caucasian", "gender": "Female", "age": "[70-80)",
            "diabetesMed": "Yes", "change": "No", "insulin": "No",
        }
    },
    {
        "name": "Low-risk patient (young, no prior admissions)",
        "data": {
            "time_in_hospital": 2, "num_lab_procedures": 25,
            "num_procedures": 0, "num_medications": 5,
            "number_outpatient": 1, "number_emergency": 0,
            "number_inpatient": 0, "number_diagnoses": 3,
            "race": "AfricanAmerican", "gender": "Female", "age": "[40-50)",
            "diabetesMed": "No", "change": "No", "insulin": "No",
        }
    },
    {
        "name": "Standard patient (default fields test)",
        "data": {
            "time_in_hospital": 5, "num_lab_procedures": 45,
            "num_procedures": 1, "num_medications": 15,
            "number_outpatient": 0, "number_emergency": 0,
            "number_inpatient": 1, "number_diagnoses": 5,
            "gender": "Female", "age": "[60-70)", "race": "Caucasian",
            "diabetesMed": "Yes", "change": "No", "A1Cresult": "None",
            "metformin": "No", "insulin": "No",
        }
    },
]

if __name__ == "__main__":
    print("=" * 55)
    print("  Hospital Readmission — End-to-End Test")
    print("=" * 55)

    all_passed = True
    for i, patient in enumerate(SAMPLE_PATIENTS, 1):
        print(f"\n  [Patient {i}] {patient['name']}")
        try:
            result = predict_readmission(patient["data"])
            print(f"  Prediction   : {result['label']}")
            print(f"  Probability  : {result['probability']:.2%}")
            print(f"  Threshold    : {result['threshold']}")
            print(f"  Status       : [PASS]")
        except Exception as e:
            print(f"  Status       : [FAIL] {e}")
            all_passed = False

    print(f"\n{'='*55}")
    print(f"  Overall: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
    print(f"{'='*55}\n")
