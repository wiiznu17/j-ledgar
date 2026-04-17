package com.jledger.core.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MerchantPayRequest(
    UUID fromAccountId,
    UUID merchantAccountId,
    BigDecimal amount,
    String currency
) {}
