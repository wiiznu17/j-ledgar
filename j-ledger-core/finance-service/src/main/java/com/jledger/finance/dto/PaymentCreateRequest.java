package com.jledger.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.jledger.finance.domain.entity.PaymentTransaction;

public record PaymentCreateRequest(
    UUID accountId,
    String referenceId,
    BigDecimal amount,
    PaymentTransaction.Type type
) {}
