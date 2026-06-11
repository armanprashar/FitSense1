package com.fitsense.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String email;
    @Column(nullable = false)
    private String password;
    private String name;
    private Integer age;
    private Double weight;
    private Double height;
    private String gender;
    private String fitnessLevel;
    private String fitnessGoal;
    private String activityLevel;
    private String experienceLevel;
    private Integer workoutDuration;
    private Integer targetDaysPerWeek;
    private String injuryLimitation;
    private Boolean safetyConfirmed;

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getFitnessLevel() { return fitnessLevel; }
    public void setFitnessLevel(String fitnessLevel) { this.fitnessLevel = fitnessLevel; }
    public String getFitnessGoal() { return fitnessGoal; }
    public void setFitnessGoal(String fitnessGoal) { this.fitnessGoal = fitnessGoal; }
    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }
    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }
    public Integer getWorkoutDuration() { return workoutDuration; }
    public void setWorkoutDuration(Integer workoutDuration) { this.workoutDuration = workoutDuration; }
    public Integer getTargetDaysPerWeek() { return targetDaysPerWeek; }
    public void setTargetDaysPerWeek(Integer targetDaysPerWeek) { this.targetDaysPerWeek = targetDaysPerWeek; }
    public String getInjuryLimitation() { return injuryLimitation; }
    public void setInjuryLimitation(String injuryLimitation) { this.injuryLimitation = injuryLimitation; }
    public Boolean getSafetyConfirmed() { return safetyConfirmed; }
    public void setSafetyConfirmed(Boolean safetyConfirmed) { this.safetyConfirmed = safetyConfirmed; }
}
