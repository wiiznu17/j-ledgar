package com.jledger.core.dto;

import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Transfer Response DTO
 * Returned to wallet-api after P2P transfer execution
 *
 * Contains:
 * - Transaction ID and status
 * - Ledger entries (immutable record of debit/credit)
 * - Amount and currency
 * - Timestamps
 */
@Data
@NoArgsConstructor
public class TransferResponse {

    private UUID id;
    private String idempotencyKey;
    private UUID fromAccountId;
    private UUID toAccountId;
    private BigDecimal amount;
    private String currency;
    private String status; // SUCCESS, PENDING, FAILED
    private List<LedgerEntryDto> ledgerEntries;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    /**
     * Create response from Transaction domain model
     */
    public TransferResponse(Transaction transaction) {
        this.id = transaction.getId();
        this.idempotencyKey = transaction.getIdempotencyKey();
        this.fromAccountId = transaction.getFromAccountId();
        this.toAccountId = transaction.getToAccountId();
        this.amount = transaction.getAmount();
        this.currency = transaction.getCurrency();
        this.status = transaction.getStatus();
        this.createdAt = transaction.getCreatedAt();
        this.updatedAt = transaction.getUpdatedAt();

        // Map ledger entries
        if (transaction.getLedgerEntries() != null) {
            this.ledgerEntries = transaction.getLedgerEntries()
                    .stream()
                    .map(LedgerEntryDto::fromDomain)
                    .toList();
        }
    }

    /**
     * Ledger Entry DTO
     * Immutable record of debit or credit
     */
    @Data
    @NoArgsConstructor
    public static class LedgerEntryDto {
        private UUID id;
        private UUID accountId;
        private String type; // DEBIT or CREDIT
        private BigDecimal amount;
        private OffsetDateTime createdAt;

        public static LedgerEntryDto fromDomain(LedgerEntry entry) {
            LedgerEntryDto dto = new LedgerEntryDto();
            dto.id = entry.getId();
            dto.accountId = entry.getAccountId();
            dto.type = entry.getType();
            dto.amount = entry.getAmount();
            dto.createdAt = entry.getCreatedAt();
            return dto;
        }
    }
}
