package com.jledger.finance.controller.system;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.MerchantPayRequest;
import com.jledger.finance.service.transaction.MerchantPaymentService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/finance/transactions")
@RequiredArgsConstructor
public class MerchantInternalController {

    private final MerchantPaymentService merchantPaymentService;

    @PostMapping("/merchant-pay")
    @PreAuthorize("hasRole('INTERNAL')")
    public ResponseEntity<Transaction> merchantPay(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody MerchantPayRequest request
    ) {
        Transaction transaction = merchantPaymentService.processMerchantPayment(idempotencyKey, request);
        return ResponseEntity.ok(transaction);
    }
}
