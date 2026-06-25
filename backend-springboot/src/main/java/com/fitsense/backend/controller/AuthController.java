package com.fitsense.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.fitsense.backend.dto.AuthDtos.*;
import com.fitsense.backend.dto.AuthDtos.AuthResponse;
import com.fitsense.backend.dto.AuthDtos.LoginRequest;
import com.fitsense.backend.dto.AuthDtos.RegisterRequest;
import com.fitsense.backend.entity.User;
import com.fitsense.backend.repo.UserRepository;
import com.fitsense.backend.security.JwtUtil;
import com.fitsense.backend.service.AiClientService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AiClientService aiClient;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, AiClientService aiClient) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.aiClient = aiClient;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        if (!Boolean.TRUE.equals(req.safetyConfirmed())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Safety confirmation is required");
        }
        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setAge(req.age());
        user.setWeight(req.weight());
        user.setHeight(req.height());
        user.setGender(req.gender());
        user.setFitnessGoal(req.fitnessGoal());
        user.setActivityLevel(req.activityLevel());
        user.setExperienceLevel(req.experienceLevel());
        user.setWorkoutDuration(req.workoutDuration());
        user.setTargetDaysPerWeek(req.targetDaysPerWeek());
        user.setInjuryLimitation(req.injuryLimitation());
        user.setSafetyConfirmed(req.safetyConfirmed());
        double bmi = req.weight() / Math.pow(req.height() / 100.0, 2);
        Map<String, Object> profile = aiClient.post("/profile", Map.of("age", req.age(), "bmi", bmi, "gender", req.gender()));
        user.setFitnessLevel(String.valueOf(profile.get("fitness_level")));
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return toAuthResponse(token, user);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return toAuthResponse(jwtUtil.generateToken(user.getEmail()), user);
    }

    @GetMapping("/me")
    public AuthResponse me(@RequestHeader("Authorization") String authorization) {
        String token = authorization.replace("Bearer ", "");
        User user = userRepository.findByEmail(jwtUtil.getEmail(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user"));
        return toAuthResponse(token, user);
    }

    private AuthResponse toAuthResponse(String token, User user) {
        return new AuthResponse(
                token,
                user.getEmail(),
                user.getName(),
                user.getFitnessLevel(),
                user.getFitnessGoal(),
                user.getExperienceLevel(),
                user.getWorkoutDuration()
        );
    }
}
