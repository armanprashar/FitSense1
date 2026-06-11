CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    age INT,
    weight DOUBLE PRECISION,
    height DOUBLE PRECISION,
    gender VARCHAR(20),
    fitness_level VARCHAR(20),
    fitness_goal VARCHAR(40),
    activity_level VARCHAR(40),
    experience_level VARCHAR(40),
    workout_duration INT,
    target_days_per_week INT,
    injury_limitation VARCHAR(40),
    safety_confirmed BOOLEAN
);

CREATE TABLE IF NOT EXISTS daily_metric (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    metric_date DATE,
    sleep_quality INT,
    energy_level INT,
    heart_rate INT,
    stress_level INT,
    soreness_level INT,
    readiness_score DOUBLE PRECISION,
    ready BOOLEAN
);
