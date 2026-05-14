CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    age INT,
    weight DOUBLE PRECISION,
    height DOUBLE PRECISION,
    gender VARCHAR(20),
    fitness_level VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS daily_metric (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    metric_date DATE,
    sleep_quality INT,
    energy_level INT,
    heart_rate INT,
    readiness_score DOUBLE PRECISION,
    ready BOOLEAN
);
