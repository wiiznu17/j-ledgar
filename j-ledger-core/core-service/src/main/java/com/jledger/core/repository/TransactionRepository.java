package com.jledger.core.repository;

import com.jledger.core.domain.Transaction;
import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(
            value = """
                    INSERT INTO transactions (
                        id,
                        idempotency_key,
                        from_account_id,
                        to_account_id,
                        transaction_type,
                        amount,
                        currency,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        :id,
                        :idempotencyKey,
                        :fromAccountId,
                        :toAccountId,
                        :transactionType,
                        :amount,
                        :currency,
                        :status,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    )
                    ON CONFLICT (idempotency_key) DO NOTHING
                    """,
            nativeQuery = true
    )
    int insertIfAbsent(
            @Param("id") UUID id,
            @Param("idempotencyKey") String idempotencyKey,
            @Param("fromAccountId") UUID fromAccountId,
            @Param("toAccountId") UUID toAccountId,
            @Param("transactionType") String transactionType,
            @Param("amount") BigDecimal amount,
            @Param("currency") String currency,
            @Param("status") String status
    );

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.fromAccountId = :userId AND t.createdAt >= :since")
    long countByFromAccountIdAndCreatedAtAfter(@Param("userId") UUID userId, @Param("since") ZonedDateTime since);

    @Query("SELECT DISTINCT t.toAccountId FROM Transaction t WHERE t.fromAccountId = :userId AND t.createdAt >= :since")
    List<UUID> findDistinctToAccountIdsByFromAccountIdAndCreatedAtAfter(@Param("userId") UUID userId, @Param("since") ZonedDateTime since);

    @Query("SELECT t FROM Transaction t WHERE t.fromAccountId = :accountId AND t.createdAt >= :since")
    List<Transaction> findByFromAccountIdAndCreatedAtAfter(@Param("accountId") UUID accountId, @Param("since") ZonedDateTime since);

    // Data retention methods
    long countByCreatedAtBefore(ZonedDateTime cutoffDate);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    int deleteByCreatedAtBefore(ZonedDateTime cutoffDate);
}
