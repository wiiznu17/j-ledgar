package com.jledger.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

/**
 * P2P Transfer Request DTO
 * Received from wallet-api
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class P2pTransferRequest {

    @NotBlank(message = "idempotencyKey is required")
    private String idempotencyKey;

    @NotBlank(message = "fromAccountId is required")
    private String fromAccountId;

    @NotBlank(message = "toAccountId is required")
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
                fromAccountId,
                toAccountId,
                amount,
                currency
        );
    }
}
