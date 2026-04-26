package com.jledger.finance.domain;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Legacy transaction class - no longer a JPA entity
// Use com.jledger.finance.model.Transaction for the new wallet-based transaction system
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Deprecated
public class Transaction {

    private UUID id;
    private List<LedgerEntry> ledgerEntries;
    private String idempotencyKey;
    private UUID fromAccountId;
    private UUID toAccountId;
    private String transactionType;
    private BigDecimal amount;
    private String currency;
    private String status;
    private Boolean flagged = false;
    private String flagReason;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
}
