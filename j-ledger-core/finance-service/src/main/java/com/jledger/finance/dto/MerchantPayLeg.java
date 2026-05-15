package com.jledger.finance.dto;

import java.math.BigDecimal;

public record MerchantPayLeg(
    String toWalletId,
    BigDecimal amount,
    String note,
    Object metadata
) {}
