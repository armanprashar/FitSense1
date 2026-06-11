from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_profile():
    r = client.post("/profile", json={"age": 28, "bmi": 23.2, "gender": "male"})
    assert r.status_code == 200
    assert "fitness_level" in r.json()


def test_readiness():
    r = client.post("/readiness", json={
        "sleep_quality": 8,
        "heart_rate": 72,
        "energy_level": 8,
        "stress_level": 3,
        "soreness_level": 2
    })
    assert r.status_code == 200
    assert "readiness_score" in r.json()


def test_generate_plan_uses_goal_examples():
    r = client.post("/generate-plan", json={
        "fitness_level": "Beginner",
        "readiness_score": 0.82,
        "previous_performance": 75,
        "fitness_goal": "fat_loss",
        "experience_level": "beginner",
        "preferred_duration": 30
    })
    body = r.json()
    assert r.status_code == 200
    assert body["workout_type"] == "Cardio + Strength Training"
    assert "Cardio" in body["examples"]
    assert "Strength" in body["examples"]


def test_generate_plan_separates_muscle_gain_from_fat_loss():
    r = client.post("/generate-plan", json={
        "fitness_level": "Intermediate",
        "readiness_score": 0.82,
        "previous_performance": 75,
        "fitness_goal": "muscle_gain",
        "experience_level": "intermediate",
        "preferred_duration": 45
    })
    body = r.json()
    assert r.status_code == 200
    assert body["workout_type"] == "Muscle Building Strength Plan"
    assert "Hypertrophy" in body["examples"]
    assert "Cardio" not in body["examples"]


def test_generate_plan_low_readiness_uses_goal_specific_recovery_name():
    r = client.post("/generate-plan", json={
        "fitness_level": "Beginner",
        "readiness_score": 0.18,
        "previous_performance": 45,
        "fitness_goal": "muscle_gain",
        "experience_level": "beginner",
        "preferred_duration": 30
    })
    body = r.json()
    assert r.status_code == 200
    assert body["workout_type"] == "Muscle Recovery + Mobility"
    assert body["intensity"] == "low"
