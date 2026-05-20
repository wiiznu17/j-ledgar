package com.jledger.finance.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.jledger.finance.domain.entity.Transaction;

/**
 * Wallet Transfer Response DTO
 * Returned after wallet-based transfer execution
 *
 * Contains:
 * - Transaction ID and status
 * - Wallet IDs (from/to)
 * - Amount and type
 * - Timestamps
 */
@Data
@NoArgsConstructor
public class WalletTransferResponse {

    private Long id;
    private String transactionId;
    private Long fromWalletId;
    private Long toWalletId;
    private String type;
    private BigDecimal amount;
    private BigDecimal fee;
    private String status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    public WalletTransferResponse(Transaction transaction) {
        this.id = transaction.getId();
        this.transactionId = transaction.getTransactionId();
        this.fromWalletId = transaction.getFromWalletId();
        this.toWalletId = transaction.getToWalletId();
        this.type = transaction.getType() != null ? transaction.getType().name() : null;
        this.amount = transaction.getAmount();
        this.fee = transaction.getFee();
        this.status = transaction.getStatus() != null ? transaction.getStatus().name() : null;
        this.description = transaction.getDescription();
        this.createdAt = transaction.getCreatedAt();
        this.updatedAt = transaction.getUpdatedAt();
        this.completedAt = transaction.getCompletedAt();
    }
}
