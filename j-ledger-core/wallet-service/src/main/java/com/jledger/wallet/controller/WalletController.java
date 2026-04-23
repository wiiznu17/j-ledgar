package com.jledger.wallet.controller;

import com.jledger.wallet.model.Wallet;
import com.jledger.wallet.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/wallets")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @PostMapping("/create")
    public ResponseEntity<Wallet> createWallet(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String currency = request.getOrDefault("currency", "THB");
        Wallet wallet = walletService.createWallet(userId, currency);
        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<Wallet> getWallet(@PathVariable String userId) {
        Optional<Wallet> wallet = walletService.getWallet(userId);
        return wallet.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{userId}/balance")
    public ResponseEntity<Wallet> updateBalance(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        Wallet wallet = walletService.updateBalance(userId, amount);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/{userId}/validate")
    public ResponseEntity<Boolean> validateTransaction(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        boolean valid = walletService.validateTransaction(userId, amount);
        return ResponseEntity.ok(valid);
    }

    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<Wallet> deactivateWallet(@PathVariable String userId) {
        Wallet wallet = walletService.deactivateWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("healthy");
    }
}
