"""
generate_plots.py
Generates Confusion Matrix and ROC Curve for the MedPredict ML pipeline.
Saves high-resolution PNGs to docs/images/ and updates README.md.

Usage:
    python scripts/generate_plots.py
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix, roc_curve, auc,
    classification_report, ConfusionMatrixDisplay
)

# ── Path setup ────────────────────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from ml.train_model import load_and_reconstruct, TARGET

PIPELINE_PATH = os.path.join(ROOT, "ml", "artifacts", "full_pipeline.joblib")
META_PATH     = os.path.join(ROOT, "ml", "artifacts", "pipeline_meta.json")
DATA_PATH     = os.path.join(ROOT, "data", "train.csv")
IMG_DIR       = os.path.join(ROOT, "docs", "images")
os.makedirs(IMG_DIR, exist_ok=True)

# ── Style ─────────────────────────────────────────────────────────────────────
PALETTE_BG   = "#0f1117"
PALETTE_CARD = "#1a1d27"
PALETTE_BLUE = "#4f8ef7"
PALETTE_RED  = "#f74f4f"
PALETTE_GREEN= "#4ff79e"
PALETTE_TEXT = "#e8eaf6"
PALETTE_MUTED= "#7986cb"

plt.rcParams.update({
    "figure.facecolor":  PALETTE_BG,
    "axes.facecolor":    PALETTE_CARD,
    "axes.edgecolor":    "#2a2d3e",
    "axes.labelcolor":   PALETTE_TEXT,
    "axes.titlecolor":   PALETTE_TEXT,
    "xtick.color":       PALETTE_TEXT,
    "ytick.color":       PALETTE_TEXT,
    "text.color":        PALETTE_TEXT,
    "grid.color":        "#2a2d3e",
    "grid.linestyle":    "--",
    "font.family":       "DejaVu Sans",
    "font.size":         11,
})

# ── Load pipeline & data ──────────────────────────────────────────────────────
print("⏳  Loading pipeline …")
pipeline  = joblib.load(PIPELINE_PATH)
with open(META_PATH) as f:
    meta = json.load(f)
threshold = meta.get("threshold", 0.5)
final     = meta.get("final_metrics", {})

print("⏳  Loading data …")
df   = load_and_reconstruct(DATA_PATH)
X    = df.drop(columns=[TARGET])
y    = df[TARGET]

print("⏳  Computing predictions …")
y_prob = pipeline.predict_proba(X)[:, 1]
y_pred = (y_prob >= threshold).astype(int)

# ─────────────────────────────────────────────────────────────────────────────
# 1. CONFUSION MATRIX
# ─────────────────────────────────────────────────────────────────────────────
print("🎨  Generating Confusion Matrix …")

cm = confusion_matrix(y, y_pred)
tn, fp, fn, tp = cm.ravel()
total = cm.sum()

fig, ax = plt.subplots(figsize=(7, 6))
fig.patch.set_facecolor(PALETTE_BG)
ax.set_facecolor(PALETTE_CARD)

# Custom colour map: dark → vibrant
cmap = matplotlib.colors.LinearSegmentedColormap.from_list(
    "med", ["#1a1d27", "#4f8ef7"], N=256
)

im = ax.imshow(cm, cmap=cmap, aspect="auto")

# Annotate each cell
labels = [
    [f"{tn:,}\n(TN)\n{tn/total*100:.1f}%", f"{fp:,}\n(FP)\n{fp/total*100:.1f}%"],
    [f"{fn:,}\n(FN)\n{fn/total*100:.1f}%", f"{tp:,}\n(TP)\n{tp/total*100:.1f}%"],
]
for i in range(2):
    for j in range(2):
        color = "#ffffff" if cm[i, j] > cm.max() / 2 else PALETTE_TEXT
        ax.text(j, i, labels[i][j], ha="center", va="center",
                fontsize=13, fontweight="bold", color=color, linespacing=1.6)

ax.set_xticks([0, 1])
ax.set_yticks([0, 1])
ax.set_xticklabels(["Not Readmitted\n(Predicted)", "Readmitted\n(Predicted)"], fontsize=11)
ax.set_yticklabels(["Not Readmitted\n(Actual)", "Readmitted\n(Actual)"], fontsize=11)
ax.set_xlabel("Predicted Label", fontsize=13, labelpad=12)
ax.set_ylabel("Actual Label",    fontsize=13, labelpad=12)

ax.set_title("Confusion Matrix — MedPredict Random Forest",
             fontsize=15, fontweight="bold", pad=20, color=PALETTE_TEXT)

# Metrics bar at the bottom
metrics_txt = (
    f"Threshold: {threshold:.4f}   |   "
    f"Accuracy: {final.get('accuracy', 0):.4f}   |   "
    f"Precision: {final.get('precision', 0):.4f}   |   "
    f"Recall: {final.get('recall', 0):.4f}   |   "
    f"F1: {final.get('f1', 0):.4f}"
)
fig.text(0.5, 0.01, metrics_txt, ha="center", fontsize=9,
         color=PALETTE_MUTED, style="italic")

plt.tight_layout(rect=[0, 0.05, 1, 1])
cm_path = os.path.join(IMG_DIR, "confusion_matrix.png")
fig.savefig(cm_path, dpi=180, bbox_inches="tight", facecolor=PALETTE_BG)
plt.close(fig)
print(f"   ✅  Saved → {cm_path}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. ROC CURVE
# ─────────────────────────────────────────────────────────────────────────────
print("🎨  Generating ROC Curve …")

fpr, tpr, roc_thresholds = roc_curve(y, y_prob)
roc_auc_val = auc(fpr, tpr)

# Find point on ROC closest to our operating threshold
closest_idx = np.argmin(np.abs(roc_thresholds - threshold))
op_fpr = fpr[closest_idx]
op_tpr = tpr[closest_idx]

fig, ax = plt.subplots(figsize=(8, 6.5))
fig.patch.set_facecolor(PALETTE_BG)
ax.set_facecolor(PALETTE_CARD)

# Shaded area under ROC
ax.fill_between(fpr, tpr, alpha=0.15, color=PALETTE_BLUE, label=None)

# ROC curve
ax.plot(fpr, tpr, color=PALETTE_BLUE, lw=2.5,
        label=f"Random Forest  (AUC = {roc_auc_val:.4f})")

# Random classifier baseline
ax.plot([0, 1], [0, 1], color="#555", lw=1.5, linestyle="--",
        label="Random Classifier (AUC = 0.50)")

# Operating threshold marker
ax.scatter(op_fpr, op_tpr, s=120, zorder=5, color=PALETTE_GREEN,
           edgecolors="#ffffff", linewidths=1.5,
           label=f"Operating Point  (threshold = {threshold:.4f})")
ax.annotate(f"  FPR={op_fpr:.3f}\n  TPR={op_tpr:.3f}",
            xy=(op_fpr, op_tpr), fontsize=9.5,
            color=PALETTE_GREEN, va="center")

# Perfect classifier reference
ax.plot([0, 0, 1], [0, 1, 1], color="#ffffff", lw=1, linestyle=":",
        alpha=0.3, label="Perfect Classifier")

ax.set_xlim([-0.01, 1.01])
ax.set_ylim([-0.01, 1.05])
ax.set_xlabel("False Positive Rate (1 − Specificity)", fontsize=13, labelpad=10)
ax.set_ylabel("True Positive Rate (Sensitivity / Recall)", fontsize=13, labelpad=10)
ax.set_title("ROC Curve — MedPredict Random Forest",
             fontsize=15, fontweight="bold", pad=20, color=PALETTE_TEXT)

ax.grid(True, alpha=0.3)
legend = ax.legend(loc="lower right", framealpha=0.15, edgecolor="#2a2d3e",
                   fontsize=10, labelcolor=PALETTE_TEXT)
legend.get_frame().set_facecolor(PALETTE_CARD)

# CV AUC annotation
cv_auc = meta.get("cv_metrics", {}).get("roc_auc", {})
if cv_auc:
    note = (f"5-Fold CV AUC: {cv_auc.get('mean', 0):.4f} "
            f"± {cv_auc.get('std', 0):.4f}")
    ax.text(0.56, 0.08, note, transform=ax.transAxes,
            fontsize=9.5, color=PALETTE_MUTED, style="italic",
            bbox=dict(facecolor=PALETTE_BG, alpha=0.6, edgecolor="#2a2d3e", pad=4))

plt.tight_layout()
roc_path = os.path.join(IMG_DIR, "roc_curve.png")
fig.savefig(roc_path, dpi=180, bbox_inches="tight", facecolor=PALETTE_BG)
plt.close(fig)
print(f"   ✅  Saved → {roc_path}")

# ─────────────────────────────────────────────────────────────────────────────
# 3. Print classification report
# ─────────────────────────────────────────────────────────────────────────────
print("\n📊  Classification Report:\n")
print(classification_report(y, y_pred, target_names=["Not Readmitted", "Readmitted"]))
print(f"\nROC AUC  : {roc_auc_val:.4f}")
print(f"Threshold: {threshold:.4f}")
print("\n✅  All plots generated successfully.")
print(f"   → docs/images/confusion_matrix.png")
print(f"   → docs/images/roc_curve.png")
