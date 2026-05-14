package com.jledger.finance.controller.transaction;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.enums.TransactionStatus;
import com.jledger.finance.domain.enums.TransactionType;
import com.jledger.finance.repository.transaction.TransactionRepository;
import com.jledger.finance.domain.entity.LedgerEntry;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transaction API", description = "Endpoints for financial transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @GetMapping
    @Operation(summary = "List all transactions", description = "Returns a paginated list of all financial transactions with optional filtering")
    public ResponseEntity<Page<Transaction>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        Page<Transaction> transactions = transactionRepository.findAllWithFilters(
                status, type, startDate, endDate, userId, PageRequest.of(page, size));
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID", description = "Returns a single transaction by its internal ID")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        return transactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/uuid/{transactionId}")
    @Operation(summary = "Get transaction by UUID string", description = "Returns a single transaction by its public transaction ID")
    public ResponseEntity<Transaction> getTransactionByUuid(@PathVariable String transactionId) {
        return transactionRepository.findByTransactionId(transactionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/ledger-entries")
    @Operation(summary = "Get ledger entries by transaction internal ID", description = "Returns all double-entry ledger records for a specific transaction using its primary key")
    public ResponseEntity<java.util.List<LedgerEntry>> getLedgerEntriesByInternalId(@PathVariable Long id) {
        return transactionRepository.findById(id)
                .map(t -> ResponseEntity.ok(ledgerEntryRepository.findByTransactionId(t.getTransactionId())))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/uuid/{transactionId}/ledger-entries")
    @Operation(summary = "Get ledger entries by transaction UUID", description = "Returns all double-entry ledger records for a specific transaction")
    public ResponseEntity<java.util.List<LedgerEntry>> getLedgerEntriesByTransactionUuid(@PathVariable String transactionId) {
        return ResponseEntity.ok(ledgerEntryRepository.findByTransactionId(transactionId));
    }
}
