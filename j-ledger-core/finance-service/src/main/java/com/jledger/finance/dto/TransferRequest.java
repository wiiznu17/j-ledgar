package com.jledger.finance.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

@Schema(description = "Request object for initiating a money transfer between two accounts")
public record TransferRequest(
        @Schema(description = "Source wallet ID", example = "W1715000000")
        @NotBlank(message = "From Wallet ID is required")
        String fromAccountId,

        @Schema(description = "Destination wallet ID", example = "W1715000001")
        @NotBlank(message = "To Wallet ID is required")
        String toAccountId,

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
