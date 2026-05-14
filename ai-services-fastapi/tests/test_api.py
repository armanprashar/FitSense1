from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_profile():
    r = client.post("/profile", json={"age": 28, "bmi": 23.2, "gender": "male"})
    assert r.status_code == 200
    assert "fitness_level" in r.json()


def test_readiness():
    r = client.post("/readiness", json={"sleep_quality": 8, "heart_rate": 72, "energy_level": 8})
    assert r.status_code == 200
    assert "readiness_score" in r.json()
