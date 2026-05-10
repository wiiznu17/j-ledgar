package com.jledger.finance.controller.ledger;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.service.wallet.WalletService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/internal/wallets")
public class InternalWalletController {

    private final WalletService walletService;
    private final ObjectMapper objectMapper;

    public InternalWalletController(WalletService walletService, ObjectMapper objectMapper) {
        this.walletService = walletService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/{userId}/topup/credit")
    public ResponseEntity<Map<String, Object>> creditTopUp(
            @PathVariable String userId,
            @RequestBody Map<String, Object> body
    ) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String currency = body.getOrDefault("currency", "THB").toString();
        String externalRef = body.get("externalRef").toString();
        String provider = body.getOrDefault("provider", "STRIPE").toString();
        String metadata = "{}";
        if (body.get("metadata") != null) {
            try {
                metadata = objectMapper.writeValueAsString(body.get("metadata"));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Invalid metadata payload");
            }
        }

        Transaction transaction = walletService.creditTopUpFromExternal(
                userId,
                amount,
                currency,
                externalRef,
                provider,
                metadata
        );

        Wallet wallet = walletService.getWallet(userId).orElseThrow(() -> new RuntimeException("Wallet not found"));
        return ResponseEntity.ok(Map.of(
                "transactionId", transaction.getTransactionId(),
                "status", transaction.getStatus().name(),
                "balanceAfter", wallet.getBalance()
        ));
    }
}
