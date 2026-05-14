# API Testing Examples

## Spring Boot APIs

### Register
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dhruv","email":"dhruv@example.com","password":"Pass#123","age":27,"weight":70,"height":173,"gender":"male"}'
```

### Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dhruv@example.com","password":"Pass#123"}'
```

### Dashboard
```bash
curl -X GET http://localhost:8080/dashboard -H "Authorization: Bearer <JWT>"
```

### Fitness Data
```bash
curl -X POST http://localhost:8080/fitness-data \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"sleepQuality":8,"energyLevel":7,"heartRate":72,"previousPerformance":75}'
```

### Plan
```bash
curl -X GET "http://localhost:8080/plan?previousPerformance=75" -H "Authorization: Bearer <JWT>"
```

## FastAPI APIs

- `POST /profile`
- `POST /readiness`
- `POST /generate-plan`
- `POST /progress`
- `POST /feedback`

Swagger: `http://localhost:8000/docs`
