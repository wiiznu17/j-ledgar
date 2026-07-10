package com.jledger.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record MerchantPayLeg(
    @NotBlank(message = "toWalletId is required")
    String toWalletId,

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    BigDecimal amount,

    String note,
    Object metadata
) {}
