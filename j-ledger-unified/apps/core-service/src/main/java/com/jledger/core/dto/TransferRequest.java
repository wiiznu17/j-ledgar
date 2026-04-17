package com.jledger.core.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "Request object for initiating a money transfer between two accounts")
public record TransferRequest(
        @Schema(description = "Source account ID", example = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
        @NotNull(message = "From Account ID is required")
        UUID fromAccountId,

        @Schema(description = "Destination account ID", example = "b1f1c2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p")
        @NotNull(message = "To Account ID is required")
        UUID toAccountId,

        @Schema(description = "Amount of money to transfer", example = "100.50")
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Transfer amount must be greater than zero")
        @Digits(integer = 16, fraction = 4, message = "Transfer amount must have up to 4 decimal places")
        BigDecimal amount,

        @Schema(description = "Currency code (3-letter ISO)", example = "THB")
        @NotBlank(message = "Currency is required")
        @Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter uppercase code")
        String currency
) {
}
