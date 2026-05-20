package com.jledger.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MerchantPayRequest(
    String fromWalletId,
    String toWalletId,
    BigDecimal amount,
    String currency,
    Object metadata
) {}
