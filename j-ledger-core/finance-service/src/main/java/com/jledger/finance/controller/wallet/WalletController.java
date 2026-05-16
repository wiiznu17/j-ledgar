package com.jledger.finance.controller.wallet;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.service.wallet.WalletService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/finance/wallets")
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

    @GetMapping("/{userId}/limits")
    public ResponseEntity<Map<String, BigDecimal>> getTransactionLimits(@PathVariable String userId) {
        Map<String, BigDecimal> limits = walletService.getTransactionLimits(userId);
        return ResponseEntity.ok(limits);
    }

    @PostMapping("/{userId}/activate")
    public ResponseEntity<Wallet> activateWallet(@PathVariable String userId) {
        Wallet wallet = walletService.activateWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<Wallet> deactivateWallet(@PathVariable String userId) {
        Wallet wallet = walletService.deactivateWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/{userId}/freeze")
    public ResponseEntity<Wallet> freezeWallet(@PathVariable String userId) {
        Wallet wallet = walletService.freezeWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/{userId}/unfreeze")
    public ResponseEntity<Wallet> unfreezeWallet(@PathVariable String userId) {
        Wallet wallet = walletService.unfreezeWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    // Top-up endpoints
    @PostMapping("/{userId}/topup/bank")
    public ResponseEntity<Transaction> topUpBank(
            @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        Long bankAccountId = Long.parseLong(request.get("bankAccountId"));
        Transaction transaction = walletService.topUpBank(userId, amount, bankAccountId);
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

    @PostMapping("/{fromUserId}/transfer/preview")
    public ResponseEntity<Map<String, Object>> previewTransferByPhone(
            @PathVariable String fromUserId,
            @RequestBody Map<String, String> request
    ) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String recipientPhone = request.get("recipientPhone");
        return ResponseEntity.ok(walletService.previewTransferByPhone(fromUserId, recipientPhone, amount));
    }

    @PostMapping("/{fromUserId}/transfer/phone")
    public ResponseEntity<Transaction> transferByPhone(
            @PathVariable String fromUserId,
            @RequestBody Map<String, Object> request
    ) {
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        String recipientPhone = (String) request.get("recipientPhone");
        String note = (String) request.get("note");
        String idempotencyKey = (String) request.get("idempotencyKey");
        Object metadata = request.get("metadata");
        Transaction transaction = walletService.transferByPhoneV1(fromUserId, recipientPhone, amount, note, idempotencyKey, metadata);
        return ResponseEntity.ok(transaction);
    }

    @GetMapping("/{userId}/topup-history")
    public ResponseEntity<List<Transaction>> getTopUpHistory(@PathVariable String userId) {
        List<Transaction> transactions = walletService.getTopUpHistory(userId);
        return ResponseEntity.ok(transactions);
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

    @PostMapping("/{userId}/qr/static")
    public ResponseEntity<String> generateStaticQR(@PathVariable String userId) {
        String qrData = walletService.generateStaticQR(userId);
        return ResponseEntity.ok(qrData);
    }

    @GetMapping("/{userId}/transactions")
    public ResponseEntity<List<Transaction>> getTransactions(
            @PathVariable String userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        LocalDateTime fromDate = parseDateTime(from);
        LocalDateTime toDate = parseDateTime(to);
        List<Transaction> transactions = walletService.getTransactions(userId, page, size, type, fromDate, toDate);
        return ResponseEntity.ok(transactions);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (Exception ignored) {
            return LocalDateTime.parse(value);
        }
    }

    @GetMapping("/transactions/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable String id) {
        return walletService.getTransactionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}/qr/history")
    public ResponseEntity<List<Transaction>> getQRHistory(@PathVariable String userId) {
        List<Transaction> transactions = walletService.getQRHistory(userId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("healthy");
    }

    // Admin endpoints
    @GetMapping("/admin/list")
    public ResponseEntity<org.springframework.data.domain.Page<Wallet>> getAllWallets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Wallet> wallets = walletService.getAllWallets(pageable);
        return ResponseEntity.ok(wallets);
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<Wallet> getWalletById(@PathVariable Long id) {
        Wallet wallet = walletService.getWalletById(id);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/admin/{id}/adjust")
    public ResponseEntity<Wallet> adjustBalance(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String reason = request.get("reason");
        Wallet wallet = walletService.adjustBalanceById(id, amount, reason);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/admin/{id}/deactivate")
    public ResponseEntity<Wallet> deactivateWalletById(@PathVariable Long id) {
        Wallet wallet = walletService.deactivateWalletById(id);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/admin/{id}/activate")
    public ResponseEntity<Wallet> activateWalletById(@PathVariable Long id) {
        Wallet wallet = walletService.activateWalletById(id);
        return ResponseEntity.ok(wallet);
    }

    @PutMapping("/admin/{id}/limits")
    public ResponseEntity<Wallet> updateLimits(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        BigDecimal dailyLimit = new BigDecimal(request.get("dailyLimit"));
        BigDecimal monthlyLimit = new BigDecimal(request.get("monthlyLimit"));
        Wallet wallet = walletService.updateLimits(id, dailyLimit, monthlyLimit);
        return ResponseEntity.ok(wallet);
    }
}
