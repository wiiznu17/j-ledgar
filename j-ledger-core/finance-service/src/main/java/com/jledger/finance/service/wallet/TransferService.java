package com.jledger.finance.service.wallet;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.TransferRequest;

public interface TransferService {
    Transaction executeTransfer(String idempotencyKey, TransferRequest request);
}
