package com.jledger.finance.controller.transaction;

import com.jledger.finance.dto.PaymentWebhookRequest;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/finance/webhooks")
@RequiredArgsConstructor
@Tag(name = "Payment Webhook API", description = "Receiver of external payment provider webhook payloads")
public class PaymentWebhookController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentWebhookController.class);
    private final PaymentService paymentService;

    @PostMapping("/payment")
    @Operation(summary = "Receive external payment webhook", description = "Processes callback notification events from payment gateways (e.g. Stripe)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Webhook verified and processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid webhook signature or data payload"),
            @ApiResponse(responseCode = "500", description = "Internal processing failure")
    })
    public ResponseEntity<Map<String, String>> handlePaymentWebhook(@Valid @RequestBody PaymentWebhookRequest request) {
        LOGGER.info("Received payment webhook for reference: {}", request.reference_id());
        
        try {
            paymentService.processWebhook(request);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Webhook processed successfully"));
        } catch (IllegalArgumentException e) {
            LOGGER.error("Invalid webhook request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", e.getMessage()));
        } catch (Exception e) {
            LOGGER.error("Error processing webhook: ", e);
            return ResponseEntity.internalServerError().body(Map.of("status", "ERROR", "message", "Internal server error"));
        }
    }
}
