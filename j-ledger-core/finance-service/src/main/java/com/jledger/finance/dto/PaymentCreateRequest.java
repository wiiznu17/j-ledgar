package com.jledger.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;
import com.jledger.finance.domain.entity.PaymentTransaction;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentCreateRequest(
    @NotNull(message = "accountId is required")
    UUID accountId,

    @NotBlank(message = "referenceId is required")
    String referenceId,

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    BigDecimal amount,

    @NotNull(message = "type is required")
    PaymentTransaction.Type type
) {}
