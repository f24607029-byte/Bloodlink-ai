"""
╔══════════════════════════════════════════════════════════════════════════════╗
║          BloodLink AI — Machine Learning Training Pipeline                   ║
║          BSAI Project | ML Course | NUTECH Islamabad                         ║
║          Dataset: bloodlink_donors.csv + bloodlink_emergency_requests.csv    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Models Trained:
  1. Logistic Regression      → Donor Availability Prediction
  2. Random Forest Classifier → Donor Availability Prediction (comparison)
  3. Naive Bayes (Multinomial)→ Emergency Urgency Classification (NLP)
  4. K-Means Clustering       → Blood Camp Placement Optimizer

Metrics Computed:
  Accuracy, Precision, Recall, F1-Score, ROC-AUC, Confusion Matrix,
  Cross-Validation, Feature Importance, Classification Report
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing   import LabelEncoder, StandardScaler
from sklearn.linear_model    import LogisticRegression
from sklearn.ensemble        import RandomForestClassifier
from sklearn.naive_bayes     import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics         import (accuracy_score, precision_score, recall_score,
                                     f1_score, roc_auc_score, confusion_matrix,
                                     classification_report, roc_curve)
from sklearn.cluster         import KMeans
from sklearn.preprocessing   import MinMaxScaler

import os, sys

OUT = "../ml_results"
os.makedirs(OUT, exist_ok=True)

plt.rcParams.update({
    'figure.facecolor': '#0f172a',
    'axes.facecolor':   '#1e293b',
    'axes.edgecolor':   '#334155',
    'axes.labelcolor':  '#e2e8f0',
    'xtick.color':      '#94a3b8',
    'ytick.color':      '#94a3b8',
    'text.color':       '#e2e8f0',
    'grid.color':       '#334155',
    'grid.linestyle':   '--',
    'grid.alpha':       0.5,
    'font.size':        11,
    'axes.titlesize':   13,
    'axes.titleweight': 'bold',
})

ACCENT   = '#ef4444'   # blood red
ACCENT2  = '#3b82f6'   # blue
ACCENT3  = '#10b981'   # green
ACCENT4  = '#f59e0b'   # amber

print("=" * 65)
print("  BloodLink AI — ML Training Pipeline")
print("=" * 65)

# ══════════════════════════════════════════════════════════════
# SECTION 1 ─ LOAD & EXPLORE DATASETS
# ══════════════════════════════════════════════════════════════
print("\n[1/7] Loading datasets...")

donors_df = pd.read_csv('../ml_datasets/bloodlink_donors.csv')
req_df    = pd.read_csv('../ml_datasets/bloodlink_emergency_requests.csv')
ts_df     = pd.read_csv('../ml_datasets/bloodlink_demand_timeseries.csv')

print(f"  ✔ Donors dataset:    {donors_df.shape[0]} rows × {donors_df.shape[1]} cols")
print(f"  ✔ Requests dataset:  {req_df.shape[0]}  rows × {req_df.shape[1]} cols")
print(f"  ✔ Time-series:       {ts_df.shape[0]}  rows × {ts_df.shape[1]} cols")
print(f"\n  Donors columns: {list(donors_df.columns)}")
print(f"\n  Missing values:\n{donors_df.isnull().sum()[donors_df.isnull().sum() > 0]}")
print(f"\n  Donor Stats:\n{donors_df[['age','donations_count','recency_weeks','weight_kg']].describe().round(2)}")

# ══════════════════════════════════════════════════════════════
# SECTION 2 ─ EXPLORATORY DATA ANALYSIS  (4-panel figure)
# ══════════════════════════════════════════════════════════════
print("\n[2/7] Generating EDA plots...")

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('BloodLink AI — Exploratory Data Analysis', color='white', fontsize=15, fontweight='bold', y=1.01)

# Panel 1: blood group distribution
bg_counts = donors_df['blood_group'].value_counts()
colors_bg  = [ACCENT if bg in ['O-','AB-','B-','A-'] else ACCENT2 for bg in bg_counts.index]
axes[0,0].bar(bg_counts.index, bg_counts.values, color=colors_bg, edgecolor='#0f172a', linewidth=0.8)
axes[0,0].set_title('Blood Group Distribution (n=1200)')
axes[0,0].set_xlabel('Blood Group'); axes[0,0].set_ylabel('Count')
for bar, val in zip(axes[0,0].patches, bg_counts.values):
    axes[0,0].text(bar.get_x()+bar.get_width()/2, bar.get_height()+8, str(val),
                   ha='center', fontsize=9, color='#e2e8f0')

# Panel 2: availability by city
avail_city = donors_df.groupby(['city','is_available']).size().unstack()
avail_city.plot(kind='bar', ax=axes[0,1], color=[ACCENT, ACCENT3], edgecolor='#0f172a', rot=0)
axes[0,1].set_title('Donor Availability by City')
axes[0,1].set_xlabel('City'); axes[0,1].set_ylabel('Count')
axes[0,1].legend(['Unavailable','Available'], facecolor='#1e293b', edgecolor='#334155')

# Panel 3: urgency distribution
urg_counts = req_df['urgency_label'].value_counts()
colors_urg = [ACCENT if u == 'critical' else ACCENT4 if u=='urgent' else ACCENT2 if u=='medium' else ACCENT3
              for u in urg_counts.index]
wedges, texts, autos = axes[1,0].pie(
    urg_counts.values, labels=urg_counts.index, autopct='%1.1f%%',
    colors=colors_urg, startangle=140,
    textprops={'color': 'white', 'fontsize': 10},
    wedgeprops={'edgecolor': '#0f172a', 'linewidth': 1.5}
)
axes[1,0].set_title('Emergency Requests — Urgency Distribution (n=800)')

# Panel 4: donation count histogram
axes[1,1].hist(donors_df['donations_count'], bins=25, color=ACCENT2, edgecolor='#0f172a', linewidth=0.6)
axes[1,1].set_title('Donation Count Distribution')
axes[1,1].set_xlabel('Total Donations'); axes[1,1].set_ylabel('Number of Donors')
axes[1,1].axvline(donors_df['donations_count'].mean(), color=ACCENT, linestyle='--', linewidth=2,
                  label=f"Mean: {donors_df['donations_count'].mean():.1f}")
axes[1,1].legend(facecolor='#1e293b', edgecolor='#334155')

plt.tight_layout()
plt.savefig(f'{OUT}/01_eda_analysis.png', dpi=150, bbox_inches='tight', facecolor='#0f172a')
plt.close()
print(f"  ✔ Saved 01_eda_analysis.png")

# ══════════════════════════════════════════════════════════════
# SECTION 3 ─ MODEL 1: LOGISTIC REGRESSION (Donor Availability)
# ══════════════════════════════════════════════════════════════
print("\n[3/7] Training Model 1: Logistic Regression — Donor Availability...")

# Feature Engineering
le_gender = LabelEncoder()
le_city   = LabelEncoder()
le_bg     = LabelEncoder()
donors_df['gender_enc']  = le_gender.fit_transform(donors_df['gender'])
donors_df['city_enc']    = le_city.fit_transform(donors_df['city'])
donors_df['bg_enc']      = le_bg.fit_transform(donors_df['blood_group'])
donors_df['rare_blood']  = donors_df['blood_group'].isin(['O-','AB-','B-','A-']).astype(int)
donors_df['eligible']    = ((donors_df['recency_weeks'] >= 8) & 
                             (donors_df['weight_kg'] >= 50) &
                             (donors_df['has_chronic_illness'] == 0)).astype(int)

FEATURES = ['age', 'gender_enc', 'city_enc', 'bg_enc', 'donations_count', 
            'streak_count', 'recency_weeks', 'weight_kg', 'has_chronic_illness',
            'rare_blood', 'eligible']
TARGET = 'is_available'

X = donors_df[FEATURES].values
y = donors_df[TARGET].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
print(f"  Train: {len(X_train)} samples | Test: {len(X_test)} samples")

scaler = StandardScaler()
X_train_sc = scaler.fit_transform(X_train)
X_test_sc  = scaler.transform(X_test)

lr_model = LogisticRegression(max_iter=300, random_state=42, C=1.0)
lr_model.fit(X_train_sc, y_train)

y_pred_lr  = lr_model.predict(X_test_sc)
y_prob_lr  = lr_model.predict_proba(X_test_sc)[:, 1]

acc_lr  = accuracy_score(y_test, y_pred_lr)
prec_lr = precision_score(y_test, y_pred_lr)
rec_lr  = recall_score(y_test, y_pred_lr)
f1_lr   = f1_score(y_test, y_pred_lr)
auc_lr  = roc_auc_score(y_test, y_prob_lr)

cv_scores = cross_val_score(lr_model, X_train_sc, y_train, cv=StratifiedKFold(5), scoring='accuracy')

print(f"  Accuracy:  {acc_lr:.4f}")
print(f"  Precision: {prec_lr:.4f}")
print(f"  Recall:    {rec_lr:.4f}")
print(f"  F1-Score:  {f1_lr:.4f}")
print(f"  ROC-AUC:   {auc_lr:.4f}")
print(f"  5-Fold CV: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print(f"\n{classification_report(y_test, y_pred_lr, target_names=['Unavailable','Available'])}")

# ══════════════════════════════════════════════════════════════
# SECTION 4 ─ MODEL 2: RANDOM FOREST (Comparison)
# ══════════════════════════════════════════════════════════════
print("\n[4/7] Training Model 2: Random Forest (Model Comparison)...")

rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)

y_pred_rf = rf_model.predict(X_test)
y_prob_rf = rf_model.predict_proba(X_test)[:, 1]

acc_rf  = accuracy_score(y_test, y_pred_rf)
prec_rf = precision_score(y_test, y_pred_rf)
rec_rf  = recall_score(y_test, y_pred_rf)
f1_rf   = f1_score(y_test, y_pred_rf)
auc_rf  = roc_auc_score(y_test, y_prob_rf)
cv_rf   = cross_val_score(rf_model, X_train, y_train, cv=StratifiedKFold(5), scoring='accuracy')

print(f"  Accuracy:  {acc_rf:.4f}")
print(f"  F1-Score:  {f1_rf:.4f}")
print(f"  ROC-AUC:   {auc_rf:.4f}")
print(f"  5-Fold CV: {cv_rf.mean():.4f} ± {cv_rf.std():.4f}")

# Plot: Confusion matrices + ROC + Feature Importance
fig, axes = plt.subplots(2, 2, figsize=(14, 11))
fig.suptitle('BloodLink AI — Logistic Regression & Random Forest Results', fontsize=14, fontweight='bold')

# Confusion Matrix — LR
cm_lr = confusion_matrix(y_test, y_pred_lr)
sns.heatmap(cm_lr, annot=True, fmt='d', cmap='Reds', ax=axes[0,0],
            xticklabels=['Unavail','Avail'], yticklabels=['Unavail','Avail'],
            linewidths=1, linecolor='#0f172a', annot_kws={'size':13,'weight':'bold'})
axes[0,0].set_title(f'Logistic Regression — Confusion Matrix\nAcc: {acc_lr:.3f} | F1: {f1_lr:.3f} | AUC: {auc_lr:.3f}')
axes[0,0].set_xlabel('Predicted'); axes[0,0].set_ylabel('Actual')

# Confusion Matrix — RF
cm_rf = confusion_matrix(y_test, y_pred_rf)
sns.heatmap(cm_rf, annot=True, fmt='d', cmap='Blues', ax=axes[0,1],
            xticklabels=['Unavail','Avail'], yticklabels=['Unavail','Avail'],
            linewidths=1, linecolor='#0f172a', annot_kws={'size':13,'weight':'bold'})
axes[0,1].set_title(f'Random Forest — Confusion Matrix\nAcc: {acc_rf:.3f} | F1: {f1_rf:.3f} | AUC: {auc_rf:.3f}')
axes[0,1].set_xlabel('Predicted'); axes[0,1].set_ylabel('Actual')

# ROC Curves — Both Models
fpr_lr, tpr_lr, _ = roc_curve(y_test, y_prob_lr)
fpr_rf, tpr_rf, _ = roc_curve(y_test, y_prob_rf)
axes[1,0].plot(fpr_lr, tpr_lr, color=ACCENT,  lw=2.5, label=f'Logistic Regression (AUC={auc_lr:.3f})')
axes[1,0].plot(fpr_rf, tpr_rf, color=ACCENT2, lw=2.5, label=f'Random Forest (AUC={auc_rf:.3f})')
axes[1,0].plot([0,1],[0,1], 'w--', lw=1.2, label='Random Baseline (AUC=0.500)')
axes[1,0].set_title('ROC Curves — Model Comparison')
axes[1,0].set_xlabel('False Positive Rate'); axes[1,0].set_ylabel('True Positive Rate')
axes[1,0].legend(facecolor='#1e293b', edgecolor='#334155', fontsize=9)
axes[1,0].fill_between(fpr_lr, tpr_lr, alpha=0.12, color=ACCENT)
axes[1,0].fill_between(fpr_rf, tpr_rf, alpha=0.12, color=ACCENT2)
axes[1,0].grid(True)

# Feature Importance — RF
importances = rf_model.feature_importances_
feat_imp = sorted(zip(FEATURES, importances), key=lambda x: x[1], reverse=True)
f_names, f_vals = zip(*feat_imp)
bars = axes[1,1].barh(range(len(f_names)), f_vals, color=[ACCENT if v > 0.12 else ACCENT2 for v in f_vals],
                       edgecolor='#0f172a', linewidth=0.8)
axes[1,1].set_yticks(range(len(f_names))); axes[1,1].set_yticklabels(f_names, fontsize=10)
axes[1,1].set_title('Feature Importance (Random Forest)')
axes[1,1].set_xlabel('Importance Score')
axes[1,1].invert_yaxis()
for bar, val in zip(bars, f_vals):
    axes[1,1].text(val + 0.003, bar.get_y() + bar.get_height()/2, f'{val:.3f}',
                   va='center', fontsize=9, color='white')

plt.tight_layout()
plt.savefig(f'{OUT}/02_classification_results.png', dpi=150, bbox_inches='tight', facecolor='#0f172a')
plt.close()
print(f"  ✔ Saved 02_classification_results.png")

# ══════════════════════════════════════════════════════════════
# SECTION 5 ─ MODEL 3: NAIVE BAYES NLP (Urgency Classification)
# ══════════════════════════════════════════════════════════════
print("\n[5/7] Training Model 3: Naive Bayes — Urgency Classification (NLP)...")

texts  = req_df['request_text'].values
labels = req_df['urgency_label'].values

X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(
    texts, labels, test_size=0.20, random_state=42, stratify=labels)

tfidf = TfidfVectorizer(ngram_range=(1,2), max_features=500, sublinear_tf=True)
X_train_tfidf = tfidf.fit_transform(X_train_t)
X_test_tfidf  = tfidf.transform(X_test_t)

nb_model = MultinomialNB(alpha=0.5)
nb_model.fit(X_train_tfidf, y_train_t)

y_pred_nb = nb_model.predict(X_test_tfidf)
acc_nb    = accuracy_score(y_test_t, y_pred_nb)
f1_nb     = f1_score(y_test_t, y_pred_nb, average='weighted')

print(f"  Accuracy:      {acc_nb:.4f}")
print(f"  F1 (weighted): {f1_nb:.4f}")
print(f"\n{classification_report(y_test_t, y_pred_nb)}")

# Test with custom inputs
test_inputs = [
    "URGENT: RTA patient at PIMS needs O- blood NOW",
    "Patient needs B+ blood for surgery scheduled next week",
    "Code red ICU — patient dying — AB- immediately",
    "Looking for A+ donors for routine thalassemia treatment"
]
print("  Live Prediction Test:")
for txt in test_inputs:
    pred = nb_model.predict(tfidf.transform([txt]))[0]
    probs = nb_model.predict_proba(tfidf.transform([txt]))[0]
    conf  = max(probs)
    print(f"  [{pred.upper():8s} {conf:.0%}] → {txt[:60]}")

# Confusion Matrix — NB
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle('BloodLink AI — NLP Urgency Classifier (Naive Bayes)', fontsize=14, fontweight='bold')

classes_nb = nb_model.classes_
cm_nb = confusion_matrix(y_test_t, y_pred_nb, labels=classes_nb)
sns.heatmap(cm_nb, annot=True, fmt='d', cmap='Reds', ax=axes[0],
            xticklabels=classes_nb, yticklabels=classes_nb,
            linewidths=1, linecolor='#0f172a', annot_kws={'size':12,'weight':'bold'})
axes[0].set_title(f'Confusion Matrix\nAcc: {acc_nb:.3f} | F1: {f1_nb:.3f}')
axes[0].set_xlabel('Predicted Class'); axes[0].set_ylabel('Actual Class')

# Top TF-IDF Features per class
top_n = 8
class_feat = {cls: [] for cls in classes_nb}
feature_names = np.array(tfidf.get_feature_names_out())
for i, cls in enumerate(nb_model.classes_):
    top_idx = nb_model.feature_log_prob_[i].argsort()[-top_n:][::-1]
    class_feat[cls] = feature_names[top_idx]

colors_class = {'critical': ACCENT, 'urgent': ACCENT4, 'medium': ACCENT2, 'low': ACCENT3}
y_pos = 0
all_words, all_scores, all_colors = [], [], []
for cls in ['critical', 'urgent', 'medium', 'low']:
    for word in class_feat[cls]:
        all_words.append(f"[{cls}] {word}")
        idx = np.where(feature_names == word)[0][0] if word in feature_names else 0
        all_scores.append(nb_model.feature_log_prob_[list(nb_model.classes_).index(cls)][idx])
        all_colors.append(colors_class[cls])

axes[1].barh(range(len(all_words)), all_scores, color=all_colors, edgecolor='#0f172a', linewidth=0.5)
axes[1].set_yticks(range(len(all_words))); axes[1].set_yticklabels(all_words, fontsize=8)
axes[1].invert_yaxis()
axes[1].set_title(f'Top TF-IDF Features per Urgency Class')
axes[1].set_xlabel('Log Probability')

from matplotlib.patches import Patch
legend_elements = [Patch(facecolor=colors_class[c], label=c.capitalize()) for c in colors_class]
axes[1].legend(handles=legend_elements, loc='lower right', facecolor='#1e293b', edgecolor='#334155')

plt.tight_layout()
plt.savefig(f'{OUT}/03_nlp_urgency_classifier.png', dpi=150, bbox_inches='tight', facecolor='#0f172a')
plt.close()
print(f"  ✔ Saved 03_nlp_urgency_classifier.png")

# ══════════════════════════════════════════════════════════════
# SECTION 6 ─ MODEL 4: K-MEANS CLUSTERING (Camp Placement)
# ══════════════════════════════════════════════════════════════
print("\n[6/7] Running K-Means Clustering — Camp Placement Optimizer...")

coords = donors_df[['latitude','longitude']].values
scaler_coords = MinMaxScaler()
coords_scaled = scaler_coords.fit_transform(coords)

# Elbow Method
inertias = []
k_range  = range(2, 9)
for k in k_range:
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(coords_scaled)
    inertias.append(km.inertia_)

# Final K=4 model
best_k = 4
km_final = KMeans(n_clusters=best_k, random_state=42, n_init=10)
donors_df['cluster'] = km_final.fit_predict(coords_scaled)
centroids_scaled = km_final.cluster_centers_
centroids = scaler_coords.inverse_transform(centroids_scaled)

print(f"  K={best_k} chosen. Cluster sizes:")
for i in range(best_k):
    ct = (donors_df['cluster'] == i).sum()
    print(f"    Cluster {i}: {ct} donors — centroid ({centroids[i,0]:.4f}, {centroids[i,1]:.4f})")

fig, axes = plt.subplots(1, 2, figsize=(14, 6))
fig.suptitle('BloodLink AI — K-Means Camp Placement Optimizer', fontsize=14, fontweight='bold')

# Elbow curve
axes[0].plot(k_range, inertias, 'o-', color=ACCENT, lw=2.5, markersize=8)
axes[0].axvline(best_k, color=ACCENT3, linestyle='--', lw=1.8, label=f'Chosen K={best_k}')
axes[0].set_title('Elbow Method — Optimal K Selection')
axes[0].set_xlabel('Number of Clusters (K)'); axes[0].set_ylabel('Inertia (WCSS)')
axes[0].legend(facecolor='#1e293b', edgecolor='#334155')
axes[0].grid(True)

# Cluster scatter
cluster_colors = [ACCENT, ACCENT2, ACCENT3, ACCENT4, '#a855f7']
for i in range(best_k):
    mask = donors_df['cluster'] == i
    axes[1].scatter(donors_df.loc[mask,'longitude'], donors_df.loc[mask,'latitude'],
                    c=cluster_colors[i], alpha=0.45, s=15, label=f'Cluster {i}')
axes[1].scatter(centroids[:,1], centroids[:,0], c='white', marker='*', s=250,
                zorder=5, edgecolors='#0f172a', linewidths=1, label='Proposed Camp Location')
axes[1].set_title(f'Donor Clusters — K={best_k} | Rawalpindi / Islamabad')
axes[1].set_xlabel('Longitude'); axes[1].set_ylabel('Latitude')
axes[1].legend(facecolor='#1e293b', edgecolor='#334155', fontsize=9)
axes[1].grid(True)

plt.tight_layout()
plt.savefig(f'{OUT}/04_kmeans_clustering.png', dpi=150, bbox_inches='tight', facecolor='#0f172a')
plt.close()
print(f"  ✔ Saved 04_kmeans_clustering.png")

# ══════════════════════════════════════════════════════════════
# SECTION 7 ─ MODEL COMPARISON SUMMARY BAR CHART
# ══════════════════════════════════════════════════════════════
print("\n[7/7] Generating final model comparison summary...")

models      = ['Logistic\nRegression', 'Random\nForest', 'Naive Bayes\n(NLP)']
accuracies  = [acc_lr, acc_rf, acc_nb]
f1_scores   = [f1_lr, f1_rf, f1_nb]
auc_scores  = [auc_lr, auc_rf, None]

fig, axes = plt.subplots(1, 3, figsize=(14, 6))
fig.suptitle('BloodLink AI — Model Comparison Summary', fontsize=14, fontweight='bold')

x = np.arange(len(models))
w = 0.35

axes[0].bar(x - w/2, accuracies, w, label='Accuracy', color=ACCENT,  edgecolor='#0f172a')
axes[0].bar(x + w/2, f1_scores,  w, label='F1-Score',  color=ACCENT2, edgecolor='#0f172a')
axes[0].set_xticks(x); axes[0].set_xticklabels(models, fontsize=10)
axes[0].set_ylim(0, 1.1); axes[0].set_title('Accuracy vs F1-Score')
axes[0].set_ylabel('Score'); axes[0].legend(facecolor='#1e293b', edgecolor='#334155')
axes[0].grid(True, axis='y')
for i, (a, f) in enumerate(zip(accuracies, f1_scores)):
    axes[0].text(i-w/2, a+0.02, f'{a:.3f}', ha='center', fontsize=9)
    axes[0].text(i+w/2, f+0.02, f'{f:.3f}', ha='center', fontsize=9)

# Cross-validation box
cv_data = [cv_scores, cv_rf]
bp = axes[1].boxplot(cv_data, patch_artist=True, widths=0.5,
                     medianprops={'color':'white','linewidth':2},
                     flierprops={'markerfacecolor': ACCENT, 'markersize': 6})
for patch, color in zip(bp['boxes'], [ACCENT, ACCENT2]):
    patch.set_facecolor(color); patch.set_alpha(0.7)
axes[1].set_xticks([1, 2]); axes[1].set_xticklabels(['Logistic\nRegression', 'Random\nForest'])
axes[1].set_title('5-Fold Cross-Validation Distribution'); axes[1].set_ylabel('Accuracy')
axes[1].grid(True, axis='y')

# Training summary table
table_data = [
    ['Logistic Regression', f'{acc_lr:.4f}', f'{prec_lr:.4f}', f'{rec_lr:.4f}', f'{f1_lr:.4f}', f'{auc_lr:.4f}'],
    ['Random Forest',       f'{acc_rf:.4f}', f'{prec_rf:.4f}', f'{rec_rf:.4f}', f'{f1_rf:.4f}', f'{auc_rf:.4f}'],
    ['Naive Bayes (NLP)',   f'{acc_nb:.4f}', '—',              '—',             f'{f1_nb:.4f}', '—'],
]
col_labels = ['Model', 'Accuracy', 'Precision', 'Recall', 'F1', 'AUC']
axes[2].axis('off')
tbl = axes[2].table(cellText=table_data, colLabels=col_labels, cellLoc='center', loc='center')
tbl.auto_set_font_size(False); tbl.set_fontsize(9)
for (row, col), cell in tbl.get_celld().items():
    cell.set_facecolor('#1e293b' if row > 0 else '#334155')
    cell.set_edgecolor('#475569')
    cell.set_text_props(color='white')
axes[2].set_title('Performance Metrics Summary')

plt.tight_layout()
plt.savefig(f'{OUT}/05_model_comparison.png', dpi=150, bbox_inches='tight', facecolor='#0f172a')
plt.close()
print(f"  ✔ Saved 05_model_comparison.png")

print("\n" + "=" * 65)
print("  TRAINING COMPLETE — Summary")
print("=" * 65)
print(f"  Logistic Regression → Acc: {acc_lr:.3f}  F1: {f1_lr:.3f}  AUC: {auc_lr:.3f}")
print(f"  Random Forest       → Acc: {acc_rf:.3f}  F1: {f1_rf:.3f}  AUC: {auc_rf:.3f}")
print(f"  Naive Bayes (NLP)   → Acc: {acc_nb:.3f}  F1: {f1_nb:.3f}")
print(f"  K-Means Clustering  → K=4 optimal (Elbow Method)")
print(f"\n  Plots saved to: {OUT}/")
print("=" * 65)
