package com.jledger.finance.dto;

import java.math.BigDecimal;

public record MerchantPayRequest(
    Long fromWalletId,
    Long toWalletId,
    BigDecimal amount,
    String currency
) {}
