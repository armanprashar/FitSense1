# FitSense - AI-Driven Adaptive Fitness Web App

Production-ready hybrid microservices implementation:
- `frontend/` - React dashboard UI
- `backend-springboot/` - Spring Boot API gateway + auth + persistence
- `ai-services-fastapi/` - FastAPI + scikit-learn AI modules
- `database/` - PostgreSQL schema and seed
- `docs/` - architecture, flow, API examples, screenshot placeholders

## Core AI Modules
1. User Fitness Profiling (`POST /profile`) - RandomForest
2. Daily Readiness Prediction (`POST /readiness`) - Logistic Regression
3. Adaptive Plan Generation (`POST /generate-plan`) - hybrid logic + score-based adaptation
4. Goal Progress Estimation (`POST /progress`) - Linear Regression
5. Feedback Adaptation (`POST /feedback`) - adjustment policy

## Quick Start (Local)

### 1) Run with Docker Compose
```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- AI FastAPI + Swagger: `http://localhost:8000/docs`

### 2) Manual Run (Optional)

#### AI Service
```bash
cd ai-services-fastapi
pip install -r requirements.txt
python app/train_models.py
uvicorn app.main:app --reload --port 8000
```

#### Backend
```bash
cd backend-springboot
mvn spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Required APIs

### Spring Boot
- `POST /auth/register`
- `POST /auth/login`
- `GET /dashboard`
- `POST /fitness-data`
- `GET /plan`

### FastAPI
- `POST /profile`
- `POST /readiness`
- `POST /generate-plan`
- `POST /progress`
- `POST /feedback`

## Testing
- AI API tests: `cd ai-services-fastapi && pytest`
- Backend smoke test: `cd backend-springboot && mvn test`

## Security
- JWT-based auth between client and backend
- BCrypt password hashing
- Input validation via Spring Validation + Pydantic models
- Environment-driven secret management recommended in production

## Deployment Targets
- Frontend: Vercel / Netlify
- Backend: Render / AWS ECS
- AI service: Docker container (Render/AWS)
- Database: Railway / Supabase PostgreSQL

## Sample Responses

### Readiness
```json
{
  "ready": true,
  "readiness_score": 0.812
}
```

### Plan
```json
{
  "workout_type": "HIIT + Strength",
  "intensity": "moderate",
  "duration_minutes": 45
}
```
