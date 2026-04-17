package com.jledger.core.dto;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Event payload for granular account-level notifications.
 * Published for each leg of a double-entry transaction.
 */
public record WalletTransactionEvent(
        UUID transactionId,
        UUID accountId,
        String type, // CREDIT or DEBIT
        BigDecimal amount,
        String currency,
        ZonedDateTime timestamp
) {}
