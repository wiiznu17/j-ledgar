package com.jledger.finance.dto;

import com.jledger.finance.domain.Transaction;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Transfer Response DTO
 * Returned to wallet-api after P2P transfer execution
 */
@Data
@NoArgsConstructor
public class TransferResponse {

    private String id; // transactionId
    private String idempotencyKey;
    private Long fromAccountId; // fromWalletId
    private Long toAccountId; // toWalletId
    private BigDecimal amount;
    private String currency;
    private String status;
    private List<LedgerEntryDto> ledgerEntries = new ArrayList<>();
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    /**
     * Create response from Transaction domain model
     */
    public TransferResponse(Transaction transaction) {
        this.id = transaction.getTransactionId();
        this.idempotencyKey = transaction.getTransactionId(); // Using transactionId as idempotency key for new system
        this.fromAccountId = transaction.getFromWalletId();
        this.toAccountId = transaction.getToWalletId();
        this.amount = transaction.getAmount();
        this.currency = "THB"; // Default for J-Ledger
        this.status = transaction.getStatus() != null ? transaction.getStatus().name() : null;
        
        if (transaction.getCreatedAt() != null) {
            this.createdAt = transaction.getCreatedAt().atZone(ZoneId.systemDefault());
        }
        if (transaction.getUpdatedAt() != null) {
            this.updatedAt = transaction.getUpdatedAt().atZone(ZoneId.systemDefault());
        }
    }

    @Data
    @NoArgsConstructor
    public static class LedgerEntryDto {
        private String id;
        private String accountId;
        private String type;
        private BigDecimal amount;
        private ZonedDateTime createdAt;
    }
}
