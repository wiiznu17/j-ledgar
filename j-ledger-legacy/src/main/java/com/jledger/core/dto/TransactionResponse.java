package com.jledger.core.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * API response DTO for a completed transfer transaction.
 *
 * <p>Returning a dedicated DTO instead of the JPA {@code Transaction} entity:
 * <ul>
 *   <li>Prevents accidental serialization of lazy-loaded associations.</li>
 *   <li>Decouples the API contract from the internal domain model.</li>
 *   <li>Allows fine-grained control over which fields are exposed.</li>
 * </ul>
 */
public record TransactionResponse(
        UUID id,
        String idempotencyKey,
        String transactionType,
        UUID fromAccountId,
        UUID toAccountId,
        BigDecimal amount,
        String currency,
        String status,
        ZonedDateTime createdAt
) {
    public static TransactionResponse from(com.jledger.core.domain.Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getIdempotencyKey(),
                transaction.getTransactionType(),
                transaction.getFromAccountId(),
                transaction.getToAccountId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }
}
