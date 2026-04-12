package com.jledger.core.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Strongly-typed event payload for the Transactional Outbox.
 * Using a record ensures field names are compile-time safe, unlike
 * building JSON manually with ObjectNode string keys.
 */
public record TransferCompletedEvent(
        UUID transactionId,
        String idempotencyKey,
        UUID fromAccountId,
        UUID toAccountId,
        String transactionType,
        BigDecimal amount,
        String currency,
        String status,
        ZonedDateTime createdAt
) {}
