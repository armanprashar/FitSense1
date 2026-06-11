package com.fitsense.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {
    public record RegisterRequest(
            @NotBlank String name, @Email String email, @NotBlank String password,
            Integer age, Double weight, Double height, String gender,
            String fitnessGoal, String activityLevel, String experienceLevel,
            Integer workoutDuration, Integer targetDaysPerWeek,
            String injuryLimitation, Boolean safetyConfirmed
    ) {}
    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record AuthResponse(
            String token, String email, String name, String fitnessLevel,
            String fitnessGoal, String experienceLevel, Integer workoutDuration
    ) {}
}
