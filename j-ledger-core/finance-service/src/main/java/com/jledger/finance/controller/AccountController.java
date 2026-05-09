package com.jledger.finance.controller;

import com.jledger.finance.domain.Account;
import com.jledger.finance.repository.AccountRepository;
import com.jledger.finance.service.AccountService;
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

    @PutMapping("/{id}/status")
    @Operation(summary = "Update account status", description = "Updates the status of an internal account")
    public ResponseEntity<Account> updateStatus(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, String> request) {
        String status = request.get("status");
        Account updated = accountService.updateAccountStatus(id, status);
        return ResponseEntity.ok(updated);
    }
}
