package com.jledger.core.controller;

import com.jledger.core.dto.PaymentWebhookRequest;
import com.jledger.core.service.PaymentService;
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
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentWebhookController.class);
    private final PaymentService paymentService;

    @PostMapping("/payment")
    public ResponseEntity<Map<String, String>> handlePaymentWebhook(@RequestBody PaymentWebhookRequest request) {
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
