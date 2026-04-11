package com.jledger.core.controller;

import com.jledger.core.domain.Account;
import com.jledger.core.repository.AccountRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Account API", description = "Endpoints for managing and querying financial accounts")
public class AccountController {

    private final AccountRepository accountRepository;

    @GetMapping("/{id}")
    @Operation(summary = "Get account details", description = "Retrieves the balance, currency, and status for a specific account.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account found"),
            @ApiResponse(responseCode = "404", description = "Account not found", 
                    content = @Content(schema = @Schema(implementation = com.jledger.core.exception.ApiErrorResponse.class)))
    })
    public ResponseEntity<Account> getAccount(
            @Parameter(description = "The unique ID of the account") @PathVariable UUID id) {
        return accountRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "List accounts for user", description = "Retrieves all accounts owned by a specific user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "List of accounts (can be empty)")
    })
    public ResponseEntity<List<Account>> listAccounts(
            @Parameter(description = "The unique ID of the user") @PathVariable UUID userId) {
        return ResponseEntity.ok(accountRepository.findByUserId(userId));
    }
}
