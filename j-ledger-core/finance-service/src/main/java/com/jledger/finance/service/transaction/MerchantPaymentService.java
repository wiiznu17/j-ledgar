package com.jledger.finance.service.transaction;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.MerchantMultiPayRequest;
import com.jledger.finance.dto.MerchantPayRequest;

public interface MerchantPaymentService {
    Transaction processMerchantPayment(String idempotencyKey, MerchantPayRequest request);
    Transaction processMultiLegMerchantPayment(String idempotencyKey, MerchantMultiPayRequest request);
}
