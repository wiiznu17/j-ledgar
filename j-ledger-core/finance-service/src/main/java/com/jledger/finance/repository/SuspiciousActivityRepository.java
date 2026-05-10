package com.jledger.finance.repository;

import com.jledger.finance.domain.SuspiciousActivityStatus;
import com.jledger.finance.domain.entity.SuspiciousActivity;

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

    // Data retention methods
    long countByCreatedAtBefore(LocalDateTime cutoffDate);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    int deleteByCreatedAtBefore(LocalDateTime cutoffDate);
}
