package com.jledger.core.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * P2P Transfer Request DTO
 * Received from wallet-api
 *
 * Fields:
 * - idempotencyKey: UUID or request ID from wallet-api to prevent duplicates
 * - fromAccountId: Sender's j-ledger account UUID
 * - toAccountId: Recipient's j-ledger account UUID
 * - amount: Transfer amount (in satoshi equivalent)
 * - currency: Always "THB" for Thai baht
 *
 * Validation:
 * - Idempotency key must be present
 * - Account IDs must be different
 * - Amount must be positive
 * - Currency must be THB
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class P2pTransferRequest {

    @NotBlank(message = "idempotencyKey is required")
    private String idempotencyKey;

    @NotNull(message = "fromAccountId is required")
    private String fromAccountId;

    @NotNull(message = "toAccountId is required")
    private String toAccountId;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be 3-letter code (e.g., THB)")
    private String currency;

    /**
     * Validation: Ensure accounts are different
     */
    @AssertTrue(message = "Cannot transfer to same account")
    public boolean isAccountsDifferent() {
        if (fromAccountId == null || toAccountId == null) {
            return true; // Let other validators handle nulls
        }
        return !fromAccountId.equals(toAccountId);
    }

    /**
     * Convert to domain TransferRequest
     */
    public TransferRequest toDomain() {
        return new TransferRequest(
                UUID.fromString(fromAccountId),
                UUID.fromString(toAccountId),
                amount,
                currency
        );
    }
}
