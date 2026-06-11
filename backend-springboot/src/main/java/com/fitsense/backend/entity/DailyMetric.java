package com.fitsense.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class DailyMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false)
    private User user;
    private LocalDate metricDate;
    private Integer sleepQuality;
    private Integer energyLevel;
    private Integer heartRate;
    private Integer stressLevel;
    private Integer sorenessLevel;
    private Double readinessScore;
    private Boolean ready;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDate getMetricDate() { return metricDate; }
    public void setMetricDate(LocalDate metricDate) { this.metricDate = metricDate; }
    public Integer getSleepQuality() { return sleepQuality; }
    public void setSleepQuality(Integer sleepQuality) { this.sleepQuality = sleepQuality; }
    public Integer getEnergyLevel() { return energyLevel; }
    public void setEnergyLevel(Integer energyLevel) { this.energyLevel = energyLevel; }
    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }
    public Integer getStressLevel() { return stressLevel; }
    public void setStressLevel(Integer stressLevel) { this.stressLevel = stressLevel; }
    public Integer getSorenessLevel() { return sorenessLevel; }
    public void setSorenessLevel(Integer sorenessLevel) { this.sorenessLevel = sorenessLevel; }
    public Double getReadinessScore() { return readinessScore; }
    public void setReadinessScore(Double readinessScore) { this.readinessScore = readinessScore; }
    public Boolean getReady() { return ready; }
    public void setReady(Boolean ready) { this.ready = ready; }
}
