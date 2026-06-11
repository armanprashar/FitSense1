package com.fitsense.backend.controller;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.fitsense.backend.dto.FitnessDtos.DailyInput;
import com.fitsense.backend.entity.DailyMetric;
import com.fitsense.backend.entity.User;
import com.fitsense.backend.repo.DailyMetricRepository;
import com.fitsense.backend.repo.UserRepository;
import com.fitsense.backend.security.JwtUtil;
import com.fitsense.backend.service.AiClientService;

@RestController
public class FitnessController {

    private final UserRepository userRepository;
    private final DailyMetricRepository metricRepository;
    private final JwtUtil jwtUtil;
    private final AiClientService aiClient;

    public FitnessController(UserRepository userRepository,
                             DailyMetricRepository metricRepository,
                             JwtUtil jwtUtil,
                             AiClientService aiClient) {
        this.userRepository = userRepository;
        this.metricRepository = metricRepository;
        this.jwtUtil = jwtUtil;
        this.aiClient = aiClient;
    }

    private User auth(String bearer) {
        if (bearer == null || !bearer.startsWith("Bearer "))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        String email = jwtUtil.getEmail(bearer.substring(7));
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestHeader("Authorization") String authHeader) {
        User user = auth(authHeader);
        
        // Fetch Top 30 instead of Top 7
        List<DailyMetric> metrics = metricRepository.findTop30ByUserOrderByMetricDateDescIdDesc(user);
        
        // Reverse the list so the chart plots from oldest day (left) to newest day (right)
        Collections.reverse(metrics);

        return Map.of(
                "user", user.getName(),
                "fitnessLevel", user.getFitnessLevel(),
                "recentMetrics", metrics
        );
    }

    @PostMapping("/fitness-data")
    public Map<String, Object> addFitnessData(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody DailyInput input
    ) {
        User user = auth(authHeader);

        Map<String, Object> readiness = aiClient.post("/readiness", Map.of(
                "sleep_quality", input.sleepQuality(),
                "heart_rate", input.heartRate(),
                "energy_level", input.energyLevel(),
                "stress_level", input.stressLevel(),
                "soreness_level", input.sorenessLevel()
        ));

        DailyMetric metric = new DailyMetric();
        metric.setUser(user);
        metric.setMetricDate(LocalDate.now());
        metric.setSleepQuality(input.sleepQuality());
        metric.setHeartRate(input.heartRate());
        metric.setEnergyLevel(input.energyLevel());
        metric.setStressLevel(input.stressLevel());
        metric.setSorenessLevel(input.sorenessLevel());

        metric.setReadinessScore(
                Double.valueOf(String.valueOf(readiness.get("readiness_score")))
        );
        
        // ✅ FIXED: Properly translates Python AI outputs (1, "1", "true", or true) into a Java boolean
        Object readyVal = readiness.get("ready");
        boolean isReady = false;
        if (readyVal != null) {
            String strVal = String.valueOf(readyVal).toLowerCase();
            isReady = strVal.equals("true") || strVal.equals("1") || strVal.equals("1.0");
        }
        metric.setReady(isReady);

        metricRepository.save(metric);

        return readiness;
    }

    @PostMapping("/plan")
    public Map<String, Object> plan(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        try {
            User user = auth(authHeader);

            double readinessScore = Double.parseDouble(body.get("readiness_score").toString());
            int previousPerformance = Integer.parseInt(body.get("previous_performance").toString());

            String fitnessLevel = user.getFitnessLevel() != null
                    ? user.getFitnessLevel()
                    : "Beginner";
            String fitnessGoal = user.getFitnessGoal() != null
                    ? user.getFitnessGoal()
                    : String.valueOf(body.getOrDefault("fitness_goal", "general_fitness"));
            String experienceLevel = user.getExperienceLevel() != null
                    ? user.getExperienceLevel()
                    : String.valueOf(body.getOrDefault("experience_level", "beginner"));
            Integer preferredDuration = user.getWorkoutDuration() != null
                    ? user.getWorkoutDuration()
                    : Integer.parseInt(String.valueOf(body.getOrDefault("preferred_duration", 30)));

            return aiClient.post("/generate-plan", Map.of(
                    "fitness_level", fitnessLevel,
                    "readiness_score", readinessScore,
                    "previous_performance", previousPerformance,
                    "fitness_goal", fitnessGoal,
                    "experience_level", experienceLevel,
                    "preferred_duration", preferredDuration
            ));

        } catch (Exception e) {
            e.printStackTrace();
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Plan generation failed"
            );
        }
    }
}
