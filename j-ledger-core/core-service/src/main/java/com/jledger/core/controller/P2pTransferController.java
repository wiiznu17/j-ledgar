package com.jledger.core.controller;

import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.service.TransferService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.UUID;

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
 * - Called from wallet-api (wallet-api → j-ledger-core)
 * - Receives wallet-api transfer data
 * - Returns transaction ID + status for tracking
 */
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Slf4j
public class P2pTransferController {

    private final TransferService transferService;

    /**
     * Execute P2P Transfer with Double-Entry Ledger
     *
     * POST /api/v1/transactions/p2p-transfer
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
    public ResponseEntity<TransferResponse> executeP2pTransfer(
            @Valid @RequestBody P2pTransferRequest request
    ) {
        log.info("P2P Transfer requested: from={}, to={}, amount={}", 
            request.getFromAccountId(), request.getToAccountId(), request.getAmount());

        try {
            // Execute transfer with double-entry ledger
            Transaction transaction = transferService.executeTransfer(
                    request.getIdempotencyKey(),
                    new TransferRequest(
                            request.getFromAccountId(),
                            request.getToAccountId(),
                            request.getAmount(),
                            request.getCurrency()
                    )
            );

            TransferResponse response = new TransferResponse(transaction);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("P2P Transfer failed", e);
            throw e;
        }
    }

    /**
     * Get Transfer Status
     * GET /api/v1/transactions/{transactionId}
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransferResponse> getTransferStatus(
            @PathVariable String transactionId
    ) {
        // TODO: Implement transaction lookup
        return ResponseEntity.notFound().build();
    }
}
