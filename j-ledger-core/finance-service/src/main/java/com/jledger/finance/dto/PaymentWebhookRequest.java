package com.jledger.finance.dto;

import java.math.BigDecimal;

public record PaymentWebhookRequest(
    String reference_id,
    String status,
    BigDecimal amount,
    String signature
) {}
