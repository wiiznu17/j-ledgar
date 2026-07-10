package com.jledger.finance.controller.wallet;

import com.jledger.finance.domain.entity.LinkedBankAccount;
import com.jledger.finance.service.wallet.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/finance/bank-accounts")
@Tag(name = "Linked Bank Account API", description = "Customer bank account linking and verification")
public class LinkedBankAccountController {

    private final WalletService walletService;

    public LinkedBankAccountController(WalletService walletService) {
        this.walletService = walletService;
    }

    @PostMapping
    @Operation(summary = "Link a new bank account", description = "Links a customer bank account to their wallet profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Bank account linked successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request payload details")
    })
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
    @Operation(summary = "List linked bank accounts", description = "Retrieves all bank accounts linked to a user profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Linked bank accounts retrieved successfully")
    })
    public ResponseEntity<List<LinkedBankAccount>> getLinkedBankAccounts(
            @Parameter(description = "User ID") @PathVariable String userId) {
        return ResponseEntity.ok(walletService.listLinkedBankAccounts(userId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete linked bank account", description = "Removes a linked bank account record from a user profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Linked bank account deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Bank account not found")
    })
    public ResponseEntity<Map<String, Object>> deleteLinkedBankAccount(
            @Parameter(description = "Bank account ID") @PathVariable Long id,
            @Parameter(description = "User ID") @RequestParam String userId
    ) {
        walletService.deleteOwnedLinkedBankAccount(userId, id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/{id}/default")
    @Operation(summary = "Set default bank account", description = "Configures a specific linked bank account as the default for payouts")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Default bank account updated successfully"),
            @ApiResponse(responseCode = "404", description = "Bank account not found")
    })
    public ResponseEntity<LinkedBankAccount> setDefaultLinkedBankAccount(
            @Parameter(description = "Bank account ID") @PathVariable Long id,
            @Parameter(description = "User ID") @RequestParam String userId
    ) {
        return ResponseEntity.ok(walletService.setDefaultLinkedBankAccount(userId, id));
    }
}
