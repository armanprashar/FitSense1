package com.fitsense.backend.dto;

public class FitnessDtos {
    public record DailyInput(
            Integer sleepQuality,
            Integer energyLevel,
            Integer heartRate,
            Integer stressLevel,
            Integer sorenessLevel,
            Integer previousPerformance
    ) {}
}
