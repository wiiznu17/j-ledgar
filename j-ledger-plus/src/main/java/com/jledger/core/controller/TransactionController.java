package com.jledger.core.controller;

import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transaction API", description = "Endpoints for managing financial transactions")
public class TransactionController {

    private final TransferService transferService;

    @PostMapping("/transfer")
    @Operation(
            summary = "Transfer money",
            description = "Executes a double-entry money transfer between two accounts. "
                    + "Requires an Idempotency-Key header to prevent duplicate charges."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transfer successful or idempotency key matched"),
            @ApiResponse(responseCode = "400", description = "Invalid request or business validation failed",
                    content = @Content(schema = @Schema(implementation = com.jledger.core.exception.ApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Sender or receiver account not found",
                    content = @Content(schema = @Schema(implementation = com.jledger.core.exception.ApiErrorResponse.class))),
            @ApiResponse(responseCode = "429", description = "Concurrent transfer is already in progress for one of the accounts. Client should retry.",
                    content = @Content(schema = @Schema(implementation = com.jledger.core.exception.ApiErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Conflict due to concurrent update (Optimistic Locking failure). Client should retry.",
                    content = @Content(schema = @Schema(implementation = com.jledger.core.exception.ApiErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "Unexpected internal server error",
                    content = @Content(schema = @Schema(implementation = com.jledger.core.exception.ApiErrorResponse.class)))
    })
    public ResponseEntity<Transaction> transfer(
            @Parameter(description = "Unique key provided by the client to avoid duplicate transaction processing", required = true)
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody TransferRequest request) {

        Transaction transaction = transferService.executeTransfer(idempotencyKey, request);
        return ResponseEntity.ok(transaction);
    }
}
