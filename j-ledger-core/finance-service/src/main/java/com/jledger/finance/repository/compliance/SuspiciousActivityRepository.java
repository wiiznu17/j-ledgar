package com.jledger.finance.repository.compliance;

import com.jledger.finance.domain.entity.SuspiciousActivity;
import com.jledger.finance.domain.enums.SuspiciousActivityStatus;
import com.jledger.finance.domain.enums.SuspiciousActivityType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

public interface SuspiciousActivityRepository extends JpaRepository<SuspiciousActivity, UUID> {

    List<SuspiciousActivity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<SuspiciousActivity> findByTransferId(UUID transferId);

    List<SuspiciousActivity> findByStatusOrderByCreatedAtDesc(SuspiciousActivityStatus status);

    @Query("SELECT s FROM SuspiciousActivity s WHERE s.userId = :userId AND s.createdAt >= :since")
    List<SuspiciousActivity> findByUserIdAndCreatedAtAfter(
        @Param("userId") UUID userId,
        @Param("since") LocalDateTime since
    );

    @Query("SELECT s FROM SuspiciousActivity s WHERE " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:userId IS NULL OR s.userId = :userId) AND " +
           "(:activityType IS NULL OR s.activityType = :activityType) AND " +
           "(:minRiskScore IS NULL OR s.riskScore >= :minRiskScore) AND " +
           "(:maxRiskScore IS NULL OR s.riskScore <= :maxRiskScore)")
    org.springframework.data.domain.Page<SuspiciousActivity> findAllWithFilters(
        @Param("status") SuspiciousActivityStatus status,
        @Param("userId") UUID userId,
        @Param("activityType") SuspiciousActivityType activityType,
        @Param("minRiskScore") Integer minRiskScore,
        @Param("maxRiskScore") Integer maxRiskScore,
        org.springframework.data.domain.Pageable pageable
    );

    // Data retention methods
    long countByCreatedAtBefore(LocalDateTime cutoffDate);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    int deleteByCreatedAtBefore(LocalDateTime cutoffDate);
}
