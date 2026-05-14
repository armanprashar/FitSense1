package com.fitsense.backend.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fitsense.backend.entity.DailyMetric;
import com.fitsense.backend.entity.User;

public interface DailyMetricRepository extends JpaRepository<DailyMetric, Long> {

    // Fetches up to 30 days of history for the charts
    List<DailyMetric> findTop30ByUserOrderByMetricDateDesc(User user);

    // Fetches the single most recent metric
    Optional<DailyMetric> findTop1ByUserOrderByMetricDateDesc(User user);

    // Counts how many days the user was "Ready"
    long countByUserAndReadyTrue(User user);
}