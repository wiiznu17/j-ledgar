package com.jledger.finance.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentWebhookRequest(
    @NotBlank(message = "reference_id is required")
    String reference_id,

    @NotBlank(message = "status is required")
    String status,

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    BigDecimal amount,

    @NotBlank(message = "signature is required")
    String signature
) {}
