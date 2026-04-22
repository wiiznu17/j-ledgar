package com.jledger.core.controller;

import com.jledger.core.domain.TransactionLimit;
import com.jledger.core.domain.TransactionLimitType;
import com.jledger.core.service.TransactionLimitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transaction-limits")
@RequiredArgsConstructor
@Tag(name = "Transaction Limits API", description = "Endpoints for managing transaction limits")
public class TransactionLimitController {

    private final TransactionLimitService transactionLimitService;

    @GetMapping("/{accountId}")
    @Operation(summary = "Get transaction limits for account", description = "Retrieves all transaction limits for a given account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transaction limits retrieved"),
            @ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<List<TransactionLimit>> getAccountLimits(
            @Parameter(description = "Account ID") @PathVariable UUID accountId) {
        List<TransactionLimit> limits = transactionLimitService.getAccountLimits(accountId);
        return ResponseEntity.ok(limits);
    }

    @PutMapping("/{accountId}/{limitType}")
    @Operation(summary = "Update transaction limit", description = "Updates a specific transaction limit for an account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Limit updated successfully"),
            @ApiResponse(responseCode = "404", description = "Account or limit not found")
    })
    public ResponseEntity<TransactionLimit> updateLimit(
            @Parameter(description = "Account ID") @PathVariable UUID accountId,
            @Parameter(description = "Limit type") @PathVariable TransactionLimitType limitType,
            @RequestBody UpdateLimitRequest request) {
        TransactionLimit limit = transactionLimitService.updateLimit(accountId, limitType, request.newLimit());
        return ResponseEntity.ok(limit);
    }

    private record UpdateLimitRequest(BigDecimal newLimit) {}
}
