package com.jledger.finance.controller.system;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.dto.MerchantMultiPayRequest;
import com.jledger.finance.dto.MerchantPayRequest;
import com.jledger.finance.service.transaction.MerchantPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/finance/transactions")
@RequiredArgsConstructor
@Tag(name = "Merchant Payment API", description = "Endpoints for merchant single/multi-leg payments")
public class MerchantInternalController {

    private final MerchantPaymentService merchantPaymentService;

    @PostMapping("/merchant-pay")
    @PreAuthorize("hasRole('INTERNAL')")
    @Operation(summary = "Process merchant payment", description = "Executes a payment transaction from a user wallet to a merchant wallet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payment processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "409", description = "System conflict or double-processing error")
    })
    public ResponseEntity<Transaction> merchantPay(
            @Parameter(description = "Idempotency Key to prevent duplicate processing") @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody MerchantPayRequest request
    ) {
        Transaction transaction = merchantPaymentService.processMerchantPayment(idempotencyKey, request);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/merchant-pay-atomic")
    @PreAuthorize("hasRole('INTERNAL')")
    @Operation(summary = "Process atomic multi-leg merchant payment", description = "Executes multi-destination/multi-leg payments atomically")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Multi-leg payments processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @ApiResponse(responseCode = "409", description = "Conflict or double-processing error")
    })
    public ResponseEntity<Transaction> merchantMultiPay(
            @Parameter(description = "Idempotency Key to prevent duplicate processing") @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody MerchantMultiPayRequest request
    ) {
        Transaction transaction = merchantPaymentService.processMultiLegMerchantPayment(idempotencyKey, request);
        return ResponseEntity.ok(transaction);
    }
}
