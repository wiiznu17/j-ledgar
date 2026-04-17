package com.jledger.core.controller;

import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.MerchantPayRequest;
import com.jledger.core.service.MerchantPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
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
