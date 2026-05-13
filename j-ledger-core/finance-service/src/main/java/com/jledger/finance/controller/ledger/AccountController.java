package com.jledger.finance.controller.ledger;

import com.jledger.finance.domain.entity.Account;
import com.jledger.finance.repository.ledger.AccountRepository;
import com.jledger.finance.service.ledger.AccountService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Account API", description = "Endpoints for internal financial accounts")
public class AccountController {

    private final AccountRepository accountRepository;
    private final AccountService accountService;

    @GetMapping
    @Operation(summary = "List all internal accounts", description = "Returns a paginated list of accounts")
    public ResponseEntity<Page<Account>> getAccounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<Account> accounts = accountRepository.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID", description = "Returns a single account record")
    public ResponseEntity<Account> getAccountById(@PathVariable UUID id) {
        return accountRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update account status", description = "Updates the status of an internal account")
    public ResponseEntity<Account> updateStatus(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> request) {
        String status = request.get("status");
        Account updated = accountService.updateAccountStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get account by user ID", description = "Returns the first account found for the given user ID")
    public ResponseEntity<Account> getAccountByUserId(@PathVariable UUID userId) {
        java.util.List<Account> accounts = accountRepository.findByUserId(userId);
        if (accounts.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(accounts.get(0));
    }

    @PostMapping
    @Operation(summary = "Create a new internal account", description = "Creates a new internal account for a user")
    public ResponseEntity<Account> createAccount(@RequestBody java.util.Map<String, String> request) {
        UUID userId = UUID.fromString(request.get("user_id"));
        String accountName = request.get("account_name");
        String currency = request.get("currency");
        
        Account created = accountService.createAccount(userId, accountName, currency);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(created);
    }
}
