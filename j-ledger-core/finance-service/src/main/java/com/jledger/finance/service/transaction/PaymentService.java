package com.jledger.finance.service.transaction;

import com.jledger.finance.domain.entity.PaymentTransaction;
import com.jledger.finance.dto.PaymentWebhookRequest;

public interface PaymentService {
    void processWebhook(PaymentWebhookRequest request);
    PaymentTransaction createPayment(com.jledger.finance.dto.PaymentCreateRequest request);
}
