package com.jledger.finance.controller;

import com.jledger.finance.domain.PaymentTransaction;
import com.jledger.finance.repository.PaymentTransactionRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Transaction API", description = "Endpoints for financial transactions")
public class TransactionController {

    private final PaymentTransactionRepository transactionRepository;

    @GetMapping
    @Operation(summary = "List all transactions", description = "Returns a paginated list of all payment transactions")
    public ResponseEntity<Page<PaymentTransaction>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<PaymentTransaction> transactions = transactionRepository.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID", description = "Returns a single payment transaction by its UUID")
    public ResponseEntity<PaymentTransaction> getTransactionById(@PathVariable UUID id) {
        return transactionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
