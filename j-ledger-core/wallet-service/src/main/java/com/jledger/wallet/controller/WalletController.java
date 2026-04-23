package com.jledger.wallet.controller;

import com.jledger.wallet.model.Transaction;
import com.jledger.wallet.model.Wallet;
import com.jledger.wallet.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/wallet")
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

    @PostMapping("/{userId}/activate")
    public ResponseEntity<Wallet> activateWallet(@PathVariable String userId) {
        Wallet wallet = walletService.activateWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/{userId}/limits")
    public ResponseEntity<Map<String, BigDecimal>> getTransactionLimits(@PathVariable String userId) {
        Map<String, BigDecimal> limits = walletService.getTransactionLimits(userId);
        return ResponseEntity.ok(limits);
    }

    // Top-up endpoints
    @PostMapping("/{userId}/topup/bank")
    public ResponseEntity<Transaction> topUpBank(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String bankAccount = request.get("bankAccount");
        Transaction transaction = walletService.topUpBank(userId, amount, bankAccount);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/topup/counter")
    public ResponseEntity<Transaction> topUpCounter(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String counterCode = request.get("counterCode");
        Transaction transaction = walletService.topUpCounter(userId, amount, counterCode);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/topup/cash")
    public ResponseEntity<Transaction> topUpCash(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String agentId = request.get("agentId");
        Transaction transaction = walletService.topUpCash(userId, amount, agentId);
        return ResponseEntity.ok(transaction);
    }

    // P2P Transfer endpoints
    @PostMapping("/{userId}/transfer/phone")
    public ResponseEntity<Transaction> transferByPhone(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String toPhone = request.get("toPhone");
        Transaction transaction = walletService.transferByPhone(userId, toPhone, amount);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/transfer/wallet-id")
    public ResponseEntity<Transaction> transferByWalletId(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String toWalletId = request.get("toWalletId");
        Transaction transaction = walletService.transferByWalletId(userId, toWalletId, amount);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/transfer/qr")
    public ResponseEntity<Transaction> transferByQR(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String qrData = request.get("qrData");
        Transaction transaction = walletService.transferByQR(userId, qrData, amount);
        return ResponseEntity.ok(transaction);
    }

    // QR Payment endpoints
    @PostMapping("/{userId}/qr/generate")
    public ResponseEntity<String> generateQR(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String qrData = walletService.generateQR(userId, amount);
        return ResponseEntity.ok(qrData);
    }

    @PostMapping("/{userId}/qr/pay")
    public ResponseEntity<Transaction> payQR(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String qrData = request.get("qrData");
        Transaction transaction = walletService.payQR(userId, qrData, amount);
        return ResponseEntity.ok(transaction);
    }

    // Bill Payment endpoints
    @PostMapping("/{userId}/payment/utility")
    public ResponseEntity<Transaction> payUtilityBill(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String billerCode = request.get("billersCode");
        String accountNumber = request.get("accountNumber");
        Transaction transaction = walletService.payUtilityBill(userId, billerCode, accountNumber, amount);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/payment/credit-card")
    public ResponseEntity<Transaction> payCreditCardBill(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String cardNumber = request.get("cardNumber");
        Transaction transaction = walletService.payCreditCardBill(userId, cardNumber, amount);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/payment/mobile")
    public ResponseEntity<Transaction> payMobileTopup(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String phoneNumber = request.get("phoneNumber");
        Transaction transaction = walletService.payMobileTopup(userId, phoneNumber, amount);
        return ResponseEntity.ok(transaction);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("healthy");
    }

    // Admin endpoints
    @GetMapping("/admin/wallets")
    public ResponseEntity<List<Wallet>> getAllWallets() {
        List<Wallet> wallets = walletService.getAllWallets();
        return ResponseEntity.ok(wallets);
    }

    @GetMapping("/admin/wallets/search")
    public ResponseEntity<List<Wallet>> searchWallets(@RequestParam String query) {
        List<Wallet> wallets = walletService.searchWallets(query);
        return ResponseEntity.ok(wallets);
    }

    @GetMapping("/admin/transactions")
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        List<Transaction> transactions = walletService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/admin/{userId}/adjust")
    public ResponseEntity<Wallet> adjustBalance(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String reason = request.get("reason");
        Wallet wallet = walletService.adjustBalance(userId, amount, reason);
        return ResponseEntity.ok(wallet);
    }
}
