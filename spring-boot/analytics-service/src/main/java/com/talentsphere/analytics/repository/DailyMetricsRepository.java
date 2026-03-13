package com.talentsphere.analytics.repository;

import com.talentsphere.analytics.entity.DailyMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyMetricsRepository extends JpaRepository<DailyMetrics, UUID> {

    Optional<DailyMetrics> findByDate(LocalDate date);

    List<DailyMetrics> findByDateBetween(LocalDate from, LocalDate to);

    @Query("SELECT SUM(dm.totalUsers) FROM DailyMetrics dm WHERE dm.date BETWEEN :from AND :to")
    Long sumTotalUsersBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(dm.activeUsers) FROM DailyMetrics dm WHERE dm.date BETWEEN :from AND :to")
    Long sumActiveUsersBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(dm.totalJobs) FROM DailyMetrics dm WHERE dm.date BETWEEN :from AND :to")
    Long sumTotalJobsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(dm.totalApplications) FROM DailyMetrics dm WHERE dm.date BETWEEN :from AND :to")
    Long sumTotalApplicationsBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(dm.totalCompanies) FROM DailyMetrics dm WHERE dm.date BETWEEN :from AND :to")
    Long sumTotalCompaniesBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(dm.searchesPerformed) FROM DailyMetrics dm WHERE dm.date BETWEEN :from AND :to")
    Long sumSearchesPerformedBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT AVG(dm.activeUsers) FROM DailyMetrics dm WHERE dm.date BETWEEN :from AND :to")
    Double averageActiveUsersBetween(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
