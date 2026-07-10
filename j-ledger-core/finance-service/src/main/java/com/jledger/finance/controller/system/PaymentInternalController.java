package com.jledger.finance.controller.system;

import com.jledger.finance.domain.entity.PaymentTransaction;
import com.jledger.finance.dto.PaymentCreateRequest;
import com.jledger.finance.service.transaction.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
@RequestMapping("/api/finance/payments")
@RequiredArgsConstructor
@Tag(name = "Payment Management API", description = "Internal payment creation and processing")
public class PaymentInternalController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentInternalController.class);
    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('INTERNAL')")
    @Operation(summary = "Create an internal payment transaction", description = "Initiates a payment transaction record in the ledger")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment transaction record created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid payment payload"),
            @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<PaymentTransaction> createPayment(@Valid @RequestBody PaymentCreateRequest request) {
        LOGGER.info("Internal request to create payment: reference={}", request.referenceId());
        PaymentTransaction payment = paymentService.createPayment(request);
        return ResponseEntity.ok(payment);
    }
}
