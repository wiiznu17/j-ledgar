package com.jledger.core.repository;

import com.jledger.core.domain.SuspiciousActivity;
import com.jledger.core.domain.SuspiciousActivityStatus;
import java.time.ZonedDateTime;
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
        @Param("since") ZonedDateTime since
    );

    // Data retention methods
    long countByCreatedAtBefore(ZonedDateTime cutoffDate);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    int deleteByCreatedAtBefore(ZonedDateTime cutoffDate);
}
