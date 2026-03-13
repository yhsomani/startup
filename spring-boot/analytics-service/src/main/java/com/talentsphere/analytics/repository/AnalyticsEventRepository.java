package com.talentsphere.analytics.repository;

import com.talentsphere.analytics.entity.AnalyticsEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, UUID> {

    List<AnalyticsEvent> findByUserId(UUID userId);

    Page<AnalyticsEvent> findByUserId(UUID userId, Pageable pageable);

    List<AnalyticsEvent> findByUserIdAndTimestampBetween(UUID userId, LocalDateTime from, LocalDateTime to);

    List<AnalyticsEvent> findByTargetIdAndTargetType(UUID targetId, String targetType);

    @Query("SELECT ae FROM AnalyticsEvent ae WHERE ae.targetId = :targetId AND ae.targetType = :targetType " +
           "AND ae.timestamp BETWEEN :from AND :to")
    List<AnalyticsEvent> findByTargetIdAndTargetTypeAndTimestampBetween(
            @Param("targetId") UUID targetId,
            @Param("targetType") String targetType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(ae) FROM AnalyticsEvent ae WHERE ae.eventType = :eventType " +
           "AND ae.timestamp BETWEEN :from AND :to")
    Long countByEventTypeAndTimestampBetween(
            @Param("eventType") AnalyticsEvent.EventType eventType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(DISTINCT ae.userId) FROM AnalyticsEvent ae WHERE ae.timestamp BETWEEN :from AND :to")
    Long countDistinctUsersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT ae.eventType, COUNT(ae) FROM AnalyticsEvent ae WHERE ae.userId = :userId " +
           "GROUP BY ae.eventType")
    List<Object[]> countEventsByUserId(@Param("userId") UUID userId);
}
