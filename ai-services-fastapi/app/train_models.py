from pathlib import Path
import numpy as np
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression, LinearRegression

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "models"
DATA_PATH = ROOT / "data" / "synthetic_fitness_sample.csv"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


def train_profile_model():
    np.random.seed(42)
    n = 500
    age = np.random.randint(18, 60, size=n)
    bmi = np.random.uniform(18, 35, size=n)
    gender = np.random.randint(0, 2, size=n)
    X = np.column_stack([age, bmi, gender])
    y = np.where((bmi < 24) & (age < 35), 2, np.where((bmi < 29), 1, 0))
    model = RandomForestClassifier(n_estimators=80, random_state=42)
    model.fit(X, y)
    joblib.dump(model, MODEL_DIR / "fitness_profile.pkl")


def train_readiness_model():
    feature_cols = ["sleep_quality", "heart_rate", "energy_level", "stress_level", "soreness_level"]

    if DATA_PATH.exists():
        df = pd.read_csv(DATA_PATH)
        X = df[feature_cols].to_numpy()
        y = df["ready"].astype(int).to_numpy()
    else:
        np.random.seed(7)
        n = 900
        sleep = np.random.randint(1, 11, n)
        hr = np.random.randint(55, 105, n)
        energy = np.random.randint(1, 11, n)
        stress = np.random.randint(1, 11, n)
        soreness = np.random.randint(1, 11, n)
        logits = (
            -3.8
            + 0.42 * sleep
            - 0.028 * hr
            + 0.48 * energy
            - 0.38 * stress
            - 0.42 * soreness
            - np.where(soreness >= 8, 0.9, 0)
            - np.where(stress >= 8, 0.5, 0)
        )
        p = 1 / (1 + np.exp(-logits))
        y = (np.random.rand(n) < p).astype(int)
        X = np.column_stack([sleep, hr, energy, stress, soreness])

    model = LogisticRegression(max_iter=500)
    model.fit(X, y)
    joblib.dump(model, MODEL_DIR / "readiness.pkl")


def train_progress_model():
    np.random.seed(21)
    n = 500
    adherence = np.random.uniform(0.2, 1.0, n)
    avg_intensity = np.random.uniform(0.3, 1.0, n)
    days = np.random.randint(1, 8, n)
    progress = (adherence * 50 + avg_intensity * 35 + days * 2).clip(0, 100)
    X = np.column_stack([adherence, avg_intensity, days])
    model = LinearRegression()
    model.fit(X, progress)
    joblib.dump(model, MODEL_DIR / "progress.pkl")


if __name__ == "__main__":
    train_profile_model()
    train_readiness_model()
    train_progress_model()
    print("Models trained and saved.")
