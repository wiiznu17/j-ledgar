package com.jledger.finance.controller;

import com.jledger.finance.dto.P2pTransferRequest;
import com.jledger.finance.dto.WalletTransferResponse;
import com.jledger.finance.service.TransferService;
import com.jledger.finance.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;

/**
 * P2P Transfer Controller
 * REST API for executing P2P transfers with double-entry bookkeeping
 *
 * Implements:
 * - Double-entry ledger (debit/credit)
 * - Idempotency key for duplicate prevention
 * - Redis-based distributed locking
 * - Transaction state management
 *
 * Integration:
 * - Called from wallet-api (wallet-api → finance-service)
 * - Receives wallet-api transfer data
 * - Returns transaction ID + status for tracking
 */
@RestController
@RequestMapping("/api/finance/transactions")
@RequiredArgsConstructor
@Slf4j
public class P2pTransferController {

    private final TransferService transferService;
    private final TransactionRepository transactionRepository;

    /**
     * Execute P2P Transfer with Double-Entry Ledger
     *
     * POST /api/finance/transactions/p2p-transfer
     *
     * Request body:
     * {
     *   "idempotencyKey": "wallet-api-transfer-{uuid}",
     *   "fromAccountId": "user-1-account-uuid",
     *   "toAccountId": "user-2-account-uuid",
     *   "amount": 10000.0,  // 100 THB
     *   "currency": "THB"
     * }
     *
     * Response (200 OK):
     * {
     *   "id": "txn-uuid",
     *   "idempotencyKey": "...",
     *   "fromAccountId": "...",
     *   "toAccountId": "...",
     *   "amount": 10000.0,
     *   "status": "SUCCESS",
     *   "createdAt": "2024-04-20T...",
     *   "ledgerEntries": [
     *     { "id": "entry-1", "accountId": "...", "type": "DEBIT", "amount": 10000.0 },
     *     { "id": "entry-2", "accountId": "...", "type": "CREDIT", "amount": 10000.0 }
     *   ]
     * }
     *
     * Errors:
     * - 400 Bad Request: Invalid transfer request
     * - 409 Conflict: System busy (account lock timeout)
     * - 500 Internal Server Error: Database or ledger error
     *
     * Security:
     * - No authentication at ledger level (wallet-api validates)
     * - Assumes wallet-api has validated user identity
     * - Uses idempotency key to prevent duplicates
     * - Distributed locking prevents race conditions
     */
    @PostMapping("/p2p-transfer")
    public ResponseEntity<WalletTransferResponse> executeP2pTransfer(
            @Valid @RequestBody P2pTransferRequest request
    ) {
        log.info("P2P Transfer requested: from={}, to={}, amount={}",
            request.getFromAccountId(), request.getToAccountId(), request.getAmount());

        try {
            // Execute transfer with double-entry ledger
            com.jledger.finance.model.Transaction transaction = transferService.executeTransfer(
                    request.getIdempotencyKey(),
                    request.toDomain()
            );

            WalletTransferResponse response = new WalletTransferResponse(transaction);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("P2P Transfer failed", e);
            throw e;
        }
    }

    /**
     * Get Transfer Status
     * GET /api/finance/transactions/{transactionId}
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<WalletTransferResponse> getTransferStatus(
            @PathVariable String transactionId
    ) {
        log.info("Get transfer status requested for transactionId={}", transactionId);

        Optional<com.jledger.finance.model.Transaction> transaction = transactionRepository.findByTransactionId(transactionId);

        return transaction.map(t -> ResponseEntity.ok(new WalletTransferResponse(t)))
                .orElse(ResponseEntity.notFound().build());
    }
}
