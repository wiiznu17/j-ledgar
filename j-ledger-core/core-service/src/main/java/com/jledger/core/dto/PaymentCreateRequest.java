package com.jledger.core.dto;

import com.jledger.core.domain.PaymentTransaction;
import java.math.BigDecimal;
import java.util.UUID;

public record PaymentCreateRequest(
    UUID accountId,
    String referenceId,
    BigDecimal amount,
    PaymentTransaction.Type type
) {}
