from pathlib import Path
from typing import Literal
import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="FitSense AI Services", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "models"

if not (MODEL_DIR / "fitness_profile.pkl").exists():
    from app.train_models import train_profile_model, train_readiness_model, train_progress_model
    train_profile_model()
    train_readiness_model()
    train_progress_model()

profile_model = joblib.load(MODEL_DIR / "fitness_profile.pkl")
readiness_model = joblib.load(MODEL_DIR / "readiness.pkl")
progress_model = joblib.load(MODEL_DIR / "progress.pkl")


class ProfileInput(BaseModel):
    age: int = Field(ge=10, le=100)
    bmi: float = Field(ge=10, le=60)
    gender: Literal["male", "female", "other"]


class ReadinessInput(BaseModel):
    sleep_quality: int = Field(ge=1, le=10)
    heart_rate: int = Field(ge=40, le=200)
    energy_level: int = Field(ge=1, le=10)


class PlanInput(BaseModel):
    fitness_level: Literal["Beginner", "Intermediate", "Advanced"]
    readiness_score: float = Field(ge=0, le=1)
    previous_performance: int = Field(ge=0, le=100)


class ProgressInput(BaseModel):
    adherence: float = Field(ge=0, le=1)
    avg_intensity: float = Field(ge=0, le=1)
    days_trained: int = Field(ge=0, le=7)
    weekly_goal: float = Field(default=100.0, gt=0)


class FeedbackInput(BaseModel):
    workout_completion: bool
    difficulty_feedback: Literal["easy", "medium", "hard"]
    current_intensity: str


@app.post("/profile")
def profile(inp: ProfileInput):
    gender_num = {"male": 1, "female": 0, "other": 0}[inp.gender]
    pred = profile_model.predict([[inp.age, inp.bmi, gender_num]])[0]
    level = {0: "Beginner", 1: "Intermediate", 2: "Advanced"}[int(pred)]
    return {"fitness_level": level}


@app.post("/readiness")
def readiness(inp: ReadinessInput):
    X = np.array([[inp.sleep_quality, inp.heart_rate, inp.energy_level]])
    score = float(readiness_model.predict_proba(X)[0][1])
    return {"ready": score >= 0.5, "readiness_score": round(score, 3)}



@app.post("/generate-plan")
def generate_plan(inp: PlanInput):

    if inp.readiness_score < 0.3:
        workout_type = "Recovery + Stretching"
        intensity = "low"
        duration = 20

    elif inp.readiness_score < 0.6:
        workout_type = "Cardio + Mobility"
        intensity = "moderate"
        duration = 35

    else:
        workout_type = "Strength + Conditioning"
        intensity = "high"
        duration = 50

    # Modify based on performance
    if inp.previous_performance < 50:
        duration -= 10
    elif inp.previous_performance > 85:
        duration += 10

    # Small variation using fitness level
    if inp.fitness_level == "Beginner":
        duration -= 5
    elif inp.fitness_level == "Advanced":
        duration += 5

    return {
        "workout_type": workout_type,
        "intensity": intensity,
        "duration_minutes": max(15, duration)
    }


@app.post("/progress")
def progress(inp: ProgressInput):
    val = float(progress_model.predict([[inp.adherence, inp.avg_intensity, inp.days_trained]])[0])
    pct = min(100.0, max(0.0, val / inp.weekly_goal * 100))

    return {
        "progress_percent": round(pct, 2),
        "remaining_effort": round(max(0.0, 100 - pct), 2)
    }


@app.post("/feedback")
def feedback(inp: FeedbackInput):
    adjustment = 0

    if not inp.workout_completion:
        adjustment -= 1

    if inp.difficulty_feedback == "easy":
        adjustment += 1

    if inp.difficulty_feedback == "hard":
        adjustment -= 1

    return {
        "adjustment": adjustment,
        "next_recommendation":
            "increase intensity" if adjustment > 0
            else "reduce intensity" if adjustment < 0
            else "keep current plan"
    }