package com.jledger.finance.repository.system;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jledger.finance.domain.entity.IntegrationOutbox;

public interface IntegrationOutboxRepository extends JpaRepository<IntegrationOutbox, UUID> {

    /**
     * Fetches the next batch of PENDING outbox events using a native PostgreSQL
     * {@code FOR UPDATE SKIP LOCKED} clause. This prevents multiple concurrent
     * poller instances (multi-pod) from claiming the same batch of events, which
     * would otherwise cause duplicate Kafka message publishing.
     *
     * <p>IMPORTANT: The caller MUST be inside an active {@code @Transactional} context
     * for the lock to be held until the batch is fully processed.
     */
    @Query(
        value = "SELECT * FROM integration_outbox WHERE status = :status ORDER BY created_at ASC LIMIT 100 FOR UPDATE SKIP LOCKED",
        nativeQuery = true
    )
    List<IntegrationOutbox> findAndLockPendingEvents(@Param("status") String status);

    List<IntegrationOutbox> findByStatusOrderByCreatedAtDesc(String status);
    
    List<IntegrationOutbox> findByEventTypeOrderByCreatedAtDesc(String eventType);
    
    List<IntegrationOutbox> findByStatusAndEventTypeOrderByCreatedAtDesc(String status, String eventType);

    List<IntegrationOutbox> findAllByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM IntegrationOutbox io WHERE io.status = :status AND io.createdAt < :cutoffTime")
    int deleteByStatusAndCreatedAtBefore(
        @Param("status") String status,
        @Param("cutoffTime") java.time.ZonedDateTime cutoffTime
    );
}
