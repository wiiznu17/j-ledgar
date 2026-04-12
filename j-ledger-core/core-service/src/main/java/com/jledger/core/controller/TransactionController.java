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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import com.jledger.core.dto.TransactionDetailsDto;
import com.jledger.core.repository.TransactionRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import java.util.UUID;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transaction API", description = "Endpoints for managing financial transactions")
public class TransactionController {

    private final TransferService transferService;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

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
            @RequestHeader(value = "Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody TransferRequest request) {

        Transaction transaction = transferService.executeTransfer(idempotencyKey, request);
        return ResponseEntity.ok(transaction);
    }

    @GetMapping
    @Operation(summary = "List all transactions", description = "Retrieves a paginated list of all transactions.")
    public ResponseEntity<Page<Transaction>> listAllTransactions(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(transactionRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction details", description = "Retrieves a transaction and its double-entry ledger entries.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transaction found"),
            @ApiResponse(responseCode = "404", description = "Transaction not found", 
                    content = @Content(schema = @Schema(implementation = com.jledger.core.exception.ApiErrorResponse.class)))
    })
    public ResponseEntity<TransactionDetailsDto> getTransactionDetails(
            @Parameter(description = "The unique ID of the transaction") @PathVariable UUID id) {
        return transactionRepository.findById(id)
                .map(transaction -> ResponseEntity.ok(TransactionDetailsDto.builder()
                        .transaction(transaction)
                        .ledgerEntries(ledgerEntryRepository.findByTransactionId(id))
                        .build()))
                .orElse(ResponseEntity.notFound().build());
    }
}
