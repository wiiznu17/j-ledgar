package com.jledger.finance.controller;

import com.jledger.finance.model.LinkedBankAccount;
import com.jledger.finance.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance/bank-accounts")
public class LinkedBankAccountController {

    private final WalletService walletService;

    public LinkedBankAccountController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping
    public ResponseEntity<LinkedBankAccount> createLinkedBankAccount(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String bankCode = request.get("bankCode");
        String bankName = request.get("bankName");
        String accountNumber = request.get("accountNumber");
        String accountName = request.get("accountName");
        String accountType = request.getOrDefault("accountType", "SAVINGS");
        boolean isDefault = Boolean.parseBoolean(request.getOrDefault("isDefault", "false"));
        boolean isVerified = Boolean.parseBoolean(request.getOrDefault("isVerified", "false"));

        LinkedBankAccount linkedBankAccount = walletService.createLinkedBankAccount(
                userId,
                bankCode,
                bankName,
                accountNumber,
                accountName,
                accountType,
                isDefault,
                isVerified
        );
        return ResponseEntity.ok(linkedBankAccount);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<LinkedBankAccount>> getLinkedBankAccounts(@PathVariable String userId) {
        return ResponseEntity.ok(walletService.listLinkedBankAccounts(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteLinkedBankAccount(
            @PathVariable Long id,
            @RequestParam String userId
    ) {
        walletService.deleteOwnedLinkedBankAccount(userId, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<LinkedBankAccount> setDefaultLinkedBankAccount(
            @PathVariable Long id,
            @RequestParam String userId
    ) {
        return ResponseEntity.ok(walletService.setDefaultLinkedBankAccount(userId, id));
    }
}
