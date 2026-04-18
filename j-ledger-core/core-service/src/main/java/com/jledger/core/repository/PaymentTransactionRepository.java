package com.jledger.core.repository;

import com.jledger.core.domain.PaymentTransaction;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByReferenceId(String referenceId);

    /**
     * Atomically claims a PENDING payment by transitioning it to PROCESSING.
     * Uses a single UPDATE ... WHERE status='PENDING' at the database level
     * to eliminate the TOCTOU race condition when concurrent webhooks arrive
     * for the same reference_id.
     *
     * @return 1 if the claim succeeded (this caller owns the webhook), 0 if already claimed.
     */
    @Modifying
    @Query("UPDATE PaymentTransaction p SET p.status = PROCESSING " +
           "WHERE p.referenceId = :referenceId " +
           "AND p.status = PENDING")
    int claimIfPending(@Param("referenceId") String referenceId);
}
