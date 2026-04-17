package com.jledger.core.controller;

import com.jledger.core.domain.PaymentTransaction;
import com.jledger.core.dto.PaymentCreateRequest;
import com.jledger.core.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentInternalController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentInternalController.class);
    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('INTERNAL')")
    public ResponseEntity<PaymentTransaction> createPayment(@RequestBody PaymentCreateRequest request) {
        LOGGER.info("Internal request to create payment: reference={}", request.referenceId());
        PaymentTransaction payment = paymentService.createPayment(request);
        return ResponseEntity.ok(payment);
    }
}
