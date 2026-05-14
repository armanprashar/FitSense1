# FitSense Architecture Diagram

```mermaid
flowchart LR
    U[Web User] --> F[React Frontend]
    F --> B[Spring Boot Backend]
    B --> DB[(PostgreSQL)]
    B --> AI[FastAPI AI Services]
    AI --> M[(scikit-learn .pkl Models)]
    B --> LOG[(Optional MongoDB Logs)]
```

## Service Responsibilities
- Frontend: auth UI, dashboard, daily metrics forms, charts, and feedback capture.
- Backend: JWT auth, API orchestration, persistence, session context, AI routing.
- AI services: fitness profile, readiness, adaptive plan, progress estimation, feedback adaptation.
