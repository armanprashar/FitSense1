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
    stress_level: int = Field(ge=1, le=10)
    soreness_level: int = Field(ge=1, le=10)


class PlanInput(BaseModel):
    fitness_level: Literal["Beginner", "Intermediate", "Advanced"]
    readiness_score: float = Field(ge=0, le=1)
    previous_performance: int = Field(ge=0, le=100)
    fitness_goal: Literal[
        "fat_loss",
        "muscle_gain",
        "endurance",
        "general_fitness",
        "recovery_mobility"
    ] = "general_fitness"
    experience_level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    preferred_duration: int = Field(default=30, ge=15, le=90)


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
    X = np.array([[
        inp.sleep_quality,
        inp.heart_rate,
        inp.energy_level,
        inp.stress_level,
        inp.soreness_level
    ]])
    score = float(readiness_model.predict_proba(X)[0][1])
    return {"ready": score >= 0.5, "readiness_score": round(score, 3)}



@app.post("/generate-plan")
def generate_plan(inp: PlanInput):
    band = (
        "low" if inp.readiness_score < 0.3
        else "moderate" if inp.readiness_score < 0.6
        else "high"
    )

    examples_by_experience = {
        "beginner": {
            "cardio": ["Brisk walking", "Light cycling", "Skipping intervals", "Swimming", "Easy jogging"],
            "strength": ["Bodyweight squats", "Wall push-ups", "Glute bridges", "Step-ups", "Plank holds"],
            "endurance": ["Walk-jog intervals", "Cycling", "Swimming", "Incline walking", "Low-impact circuits"],
            "mobility": ["Dynamic stretching", "Yoga flow", "Hip mobility", "Shoulder circles", "Breathing drills"]
        },
        "intermediate": {
            "cardio": ["Running", "Cycling", "Brisk walking", "Skipping", "Swimming"],
            "strength": ["Goblet squats", "Push-ups", "Dumbbell rows", "Lunges", "Romanian deadlifts"],
            "endurance": ["Tempo runs", "Cycling intervals", "Rowing", "Swimming laps", "Hill walking"],
            "mobility": ["Yoga flow", "Foam rolling", "Hip openers", "Thoracic rotations", "Band mobility"]
        },
        "advanced": {
            "cardio": ["Interval running", "Hill sprints", "Fast cycling", "Rowing intervals", "Swimming intervals"],
            "strength": ["Barbell squats", "Deadlifts", "Bench press", "Pull-ups", "Walking lunges"],
            "endurance": ["Long runs", "Threshold intervals", "Bike intervals", "Rowing blocks", "Swim sets"],
            "mobility": ["Loaded mobility", "Deep squat holds", "Cossack squats", "Shoulder mobility", "Recovery yoga"]
        }
    }

    examples = examples_by_experience[inp.experience_level]

    if band == "low":
        low_readiness_workouts = {
            "fat_loss": "Light Cardio Recovery",
            "muscle_gain": "Muscle Recovery + Mobility",
            "endurance": "Easy Aerobic Recovery",
            "general_fitness": "Recovery + Mobility",
            "recovery_mobility": "Deep Recovery + Flexibility"
        }
        workout_type = low_readiness_workouts[inp.fitness_goal]
        intensity = "low"
        focus = "Reduce fatigue and restore movement quality."
        example_sections = {
            "Recovery": examples["mobility"],
            "Light Cardio": examples["cardio"][:3]
        }

    elif inp.fitness_goal == "fat_loss":
        workout_type = "Low-impact Cardio + Strength" if band == "moderate" else "Cardio + Strength Training"
        intensity = "moderate" if band == "moderate" else "high"
        focus = "Burn calories while preserving muscle."
        example_sections = {
            "Cardio": examples["cardio"],
            "Strength": examples["strength"]
        }

    elif inp.fitness_goal == "muscle_gain":
        workout_type = "Strength Technique + Muscle Building" if band == "moderate" else "Muscle Building Strength Plan"
        intensity = "moderate" if band == "moderate" else "high"
        focus = "Prioritize progressive overload, muscle tension, and controlled reps for size and strength."
        example_sections = {
            "Strength": examples["strength"],
            "Hypertrophy": [
                "Controlled squats",
                "Chest press",
                "Rows",
                "Shoulder press",
                "Split squats"
            ]
        }

    elif inp.fitness_goal == "endurance":
        workout_type = "Steady Cardio + Mobility" if band == "moderate" else "Endurance Training + Strength Support"
        intensity = "moderate" if band == "moderate" else "high"
        focus = "Improve stamina, heart fitness, and aerobic capacity."
        example_sections = {
            "Endurance": examples["endurance"],
            "Strength Support": examples["strength"][:3]
        }

    elif inp.fitness_goal == "recovery_mobility":
        workout_type = "Mobility + Recovery Strength" if band == "moderate" else "Mobility + Light Functional Training"
        intensity = "low" if band == "moderate" else "moderate"
        focus = "Improve movement, flexibility, and joint-friendly strength."
        example_sections = {
            "Mobility": examples["mobility"],
            "Light Strength": examples["strength"][:3]
        }

    else:
        workout_type = "Balanced Fitness Mix" if band == "moderate" else "Full Body Strength + Cardio"
        intensity = "moderate" if band == "moderate" else "high"
        focus = "Build a balanced mix of strength, stamina, and mobility."
        example_sections = {
            "Cardio": examples["cardio"][:4],
            "Strength": examples["strength"][:4],
            "Mobility": examples["mobility"][:3]
        }

    duration = inp.preferred_duration
    if band == "low":
        duration = min(duration, 25)
    elif band == "high":
        duration = max(duration, 35)

    # Modify based on performance
    if inp.previous_performance < 50:
        duration -= 10
    elif inp.previous_performance > 85:
        duration += 10

    # Small variation using saved workout experience
    if inp.experience_level == "beginner" or inp.fitness_level == "Beginner":
        duration -= 5
    elif inp.experience_level == "advanced" or inp.fitness_level == "Advanced":
        duration += 5

    return {
        "workout_type": workout_type,
        "intensity": intensity,
        "duration_minutes": max(15, duration),
        "focus": focus,
        "examples": example_sections
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
