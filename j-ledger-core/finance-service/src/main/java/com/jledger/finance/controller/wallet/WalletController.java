package com.jledger.finance.controller.wallet;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.service.wallet.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Wallet Operations API", description = "Wallet balance queries, top-ups, transaction history, limits, and QR codes")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @PostMapping("/create")
    @Operation(summary = "Create user wallet", description = "Initializes a new wallet account for a user ID and currency code")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request details")
    })
    public ResponseEntity<Wallet> createWallet(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String currency = request.getOrDefault("currency", "THB");
        Wallet wallet = walletService.createWallet(userId, currency);
        return ResponseEntity.ok(wallet);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get wallet by user ID", description = "Fetches the wallet account details linked to a user profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet record retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Wallet> getWallet(
            @Parameter(description = "User ID") @PathVariable String userId) {
        Optional<Wallet> wallet = walletService.getWallet(userId);
        return wallet.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}/limits")
    @Operation(summary = "Get user transaction limits", description = "Fetches configured daily and monthly transaction limits for a wallet profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Limits retrieved successfully")
    })
    public ResponseEntity<Map<String, BigDecimal>> getTransactionLimits(
            @Parameter(description = "User ID") @PathVariable String userId) {
        Map<String, BigDecimal> limits = walletService.getTransactionLimits(userId);
        return ResponseEntity.ok(limits);
    }

    @PostMapping("/{userId}/activate")
    @Operation(summary = "Activate wallet", description = "Sets the status of a user's wallet profile to ACTIVE")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet activated successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Wallet> activateWallet(
            @Parameter(description = "User ID") @PathVariable String userId) {
        Wallet wallet = walletService.activateWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/{userId}/deactivate")
    @Operation(summary = "Deactivate wallet", description = "Sets the status of a user's wallet profile to INACTIVE")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet deactivated successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Wallet> deactivateWallet(
            @Parameter(description = "User ID") @PathVariable String userId) {
        Wallet wallet = walletService.deactivateWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/{userId}/freeze")
    @Operation(summary = "Freeze wallet", description = "Sets the status of a user's wallet profile to FROZEN")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet frozen successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Wallet> freezeWallet(
            @Parameter(description = "User ID") @PathVariable String userId) {
        Wallet wallet = walletService.freezeWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/{userId}/unfreeze")
    @Operation(summary = "Unfreeze wallet", description = "Restores the status of a FROZEN wallet to ACTIVE")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet unfrozen successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Wallet> unfreezeWallet(
            @Parameter(description = "User ID") @PathVariable String userId) {
        Wallet wallet = walletService.unfreezeWallet(userId);
        return ResponseEntity.ok(wallet);
    }

    // Top-up endpoints
    @PostMapping("/{userId}/topup/bank")
    @Operation(summary = "Top up via linked bank account", description = "Debits user linked bank account and credits their wallet balance")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Topup processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid topup details")
    })
    public ResponseEntity<Transaction> topUpBank(
            @Parameter(description = "User ID") @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        Long bankAccountId = Long.parseLong(request.get("bankAccountId"));
        Transaction transaction = walletService.topUpBank(userId, amount, bankAccountId);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/topup/counter")
    @Operation(summary = "Top up via counter service", description = "Credits user wallet with cash deposited at a counter service agent")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Counter topup processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid counter topup details")
    })
    public ResponseEntity<Transaction> topUpCounter(
            @Parameter(description = "User ID") @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String counterCode = request.get("counterCode");
        Transaction transaction = walletService.topUpCounter(userId, amount, counterCode);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/topup/cash")
    @Operation(summary = "Top up via cash agent", description = "Credits user wallet with cash deposited via an authorized physical agent")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cash topup processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid cash agent topup details")
    })
    public ResponseEntity<Transaction> topUpCash(
            @Parameter(description = "User ID") @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String agentId = request.get("agentId");
        Transaction transaction = walletService.topUpCash(userId, amount, agentId);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{fromUserId}/transfer/preview")
    @Operation(summary = "Preview transfer by phone number", description = "Calculates fees, limits, and recipient name for a proposed transfer")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transfer preview generated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid transfer details")
    })
    public ResponseEntity<Map<String, Object>> previewTransferByPhone(
            @Parameter(description = "Sender user ID") @PathVariable String fromUserId,
            @RequestBody Map<String, String> request
    ) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String recipientPhone = request.get("recipientPhone");
        return ResponseEntity.ok(walletService.previewTransferByPhone(fromUserId, recipientPhone, amount));
    }

    @PostMapping("/{fromUserId}/transfer/phone")
    @Operation(summary = "Execute transfer by phone number", description = "Performs a money transfer from a sender wallet to a recipient wallet via phone lookup")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transfer executed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid transfer details"),
            @ApiResponse(responseCode = "409", description = "Duplicate transfer request detected")
    })
    public ResponseEntity<Transaction> transferByPhone(
            @Parameter(description = "Sender user ID") @PathVariable String fromUserId,
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
    @Operation(summary = "Get top-up history", description = "Retrieves a listing of all historical top-up transactions for a user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Topup history retrieved successfully")
    })
    public ResponseEntity<List<Transaction>> getTopUpHistory(
            @Parameter(description = "User ID") @PathVariable String userId) {
        List<Transaction> transactions = walletService.getTopUpHistory(userId);
        return ResponseEntity.ok(transactions);
    }

    // QR Payment endpoints
    @PostMapping("/{userId}/qr/generate")
    @Operation(summary = "Generate dynamic payment QR code", description = "Generates QR code payload representing a request for a specific amount of money")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "QR payload generated successfully")
    })
    public ResponseEntity<String> generateQR(
            @Parameter(description = "User ID") @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String qrData = walletService.generateQR(userId, amount);
        return ResponseEntity.ok(qrData);
    }

    @PostMapping("/{userId}/qr/pay")
    @Operation(summary = "Pay generated QR code", description = "Executes a transaction using scanned QR code payload details")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "QR code payment processed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid QR code details or balance")
    })
    public ResponseEntity<Transaction> payQR(
            @Parameter(description = "Paying user ID") @PathVariable String userId,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String qrData = request.get("qrData");
        Transaction transaction = walletService.payQR(userId, qrData, amount);
        return ResponseEntity.ok(transaction);
    }

    @PostMapping("/{userId}/qr/static")
    @Operation(summary = "Generate static QR code", description = "Generates a persistent QR code payload for a user's wallet profile (without set amount)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Static QR payload generated successfully")
    })
    public ResponseEntity<String> generateStaticQR(
            @Parameter(description = "User ID") @PathVariable String userId) {
        String qrData = walletService.generateStaticQR(userId);
        return ResponseEntity.ok(qrData);
    }

    @GetMapping("/{userId}/transactions")
    @Operation(summary = "List transactions with filters", description = "Retrieves a paginated list of transactions filtered by type and date range")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transaction list retrieved successfully")
    })
    public ResponseEntity<List<Transaction>> getTransactions(
            @Parameter(description = "User ID") @PathVariable String userId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(required = false) Integer page,
            @Parameter(description = "Page size") @RequestParam(required = false) Integer size,
            @Parameter(description = "Transaction type") @RequestParam(required = false) TransactionType type,
            @Parameter(description = "Start datetime (ISO string)") @RequestParam(required = false) String from,
            @Parameter(description = "End datetime (ISO string)") @RequestParam(required = false) String to
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
            return java.time.LocalDateTime.parse(value);
        }
    }

    @GetMapping("/transactions/{id}")
    @Operation(summary = "Get transaction details by ID", description = "Queries full details of a specific transaction by its unique ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transaction record retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Transaction not found")
    })
    public ResponseEntity<Transaction> getTransactionById(
            @Parameter(description = "Transaction UUID") @PathVariable String id) {
        return walletService.getTransactionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}/qr/history")
    @Operation(summary = "Get QR code payment history", description = "Retrieves historical QR-based transactions for a wallet profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "QR history list retrieved successfully")
    })
    public ResponseEntity<List<Transaction>> getQRHistory(
            @Parameter(description = "User ID") @PathVariable String userId) {
        List<Transaction> transactions = walletService.getQRHistory(userId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/health")
    @Operation(summary = "Liveness/Readiness health probe", description = "Simple endpoint to verify if the service is running and healthy")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Service is healthy")
    })
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("healthy");
    }

    // Admin endpoints
    @GetMapping("/admin/list")
    @Operation(summary = "List all wallets (Admin)", description = "Admin endpoint to retrieve a paginated list of all active/inactive wallets in the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallets page retrieved successfully")
    })
    public ResponseEntity<org.springframework.data.domain.Page<Wallet>> getAllWallets(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Wallet> wallets = walletService.getAllWallets(pageable);
        return ResponseEntity.ok(wallets);
    }

    @GetMapping("/admin/{id}")
    @Operation(summary = "Get wallet details by ID (Admin)", description = "Admin endpoint to fetch a single wallet record details by its internal DB database ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet record retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet record not found")
    })
    public ResponseEntity<Wallet> getWalletById(
            @Parameter(description = "Wallet internal DB ID") @PathVariable Long id) {
        Wallet wallet = walletService.getWalletById(id);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/admin/{id}/adjust")
    @Operation(summary = "Adjust wallet balance (Admin)", description = "Admin endpoint to manually adjust/override a wallet balance with audit log record")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet balance adjusted successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet record not found")
    })
    public ResponseEntity<Wallet> adjustBalance(
            @Parameter(description = "Wallet internal DB ID") @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        BigDecimal amount = new BigDecimal(request.get("amount"));
        String reason = request.get("reason");
        Wallet wallet = walletService.adjustBalanceById(id, amount, reason);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/admin/{id}/deactivate")
    @Operation(summary = "Deactivate wallet by ID (Admin)", description = "Admin endpoint to administratively deactivate a wallet by its internal DB ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet deactivated successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet record not found")
    })
    public ResponseEntity<Wallet> deactivateWalletById(
            @Parameter(description = "Wallet internal DB ID") @PathVariable Long id) {
        Wallet wallet = walletService.deactivateWalletById(id);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/admin/{id}/activate")
    @Operation(summary = "Activate wallet by ID (Admin)", description = "Admin endpoint to administratively activate a wallet by its internal DB ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet activated successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet record not found")
    })
    public ResponseEntity<Wallet> activateWalletById(
            @Parameter(description = "Wallet internal DB ID") @PathVariable Long id) {
        Wallet wallet = walletService.activateWalletById(id);
        return ResponseEntity.ok(wallet);
    }

    @PutMapping("/admin/{id}/limits")
    @Operation(summary = "Update wallet limits (Admin)", description = "Admin endpoint to modify maximum daily and monthly transaction limits of a wallet")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Wallet limits updated successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet record not found")
    })
    public ResponseEntity<Wallet> updateLimits(
            @Parameter(description = "Wallet internal DB ID") @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        BigDecimal dailyLimit = new BigDecimal(request.get("dailyLimit"));
        BigDecimal monthlyLimit = new BigDecimal(request.get("monthlyLimit"));
        Wallet wallet = walletService.updateLimits(id, dailyLimit, monthlyLimit);
        return ResponseEntity.ok(wallet);
    }
}
