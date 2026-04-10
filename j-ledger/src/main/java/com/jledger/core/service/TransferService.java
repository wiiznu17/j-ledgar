package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String FROZEN_STATUS = "FROZEN";
    private static final String TRANSFER_TYPE = "TRANSFER";
    private static final String SUCCESS_STATUS = "SUCCESS";
    private static final String DEBIT_ENTRY = "DEBIT";
    private static final String CREDIT_ENTRY = "CREDIT";

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Transactional
    public Transaction executeTransfer(String idempotencyKey, TransferRequest request) {
        validateIdempotencyKey(idempotencyKey);
        Transaction existingTransaction = transactionRepository.findByIdempotencyKey(idempotencyKey).orElse(null);
        if (existingTransaction != null) {
            return existingTransaction;
        }

        validateTransferRequest(request);
        return processTransfer(idempotencyKey, request);
    }

    private Transaction processTransfer(String idempotencyKey, TransferRequest request) {
        Account sender = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid sender account"));

        Account receiver = accountRepository.findById(request.toAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid receiver account"));

        validateTransfer(request, sender, receiver);

        sender.withdraw(request.amount());
        receiver.deposit(request.amount());

        // Force the optimistic-lock version check before writing dependent records.
        accountRepository.flush();

        Transaction transaction = transactionRepository.save(Transaction.builder()
                .idempotencyKey(idempotencyKey)
                .transactionType(TRANSFER_TYPE)
                .amount(request.amount())
                .currency(request.currency())
                .status(SUCCESS_STATUS)
                .build());

        LedgerEntry senderEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(sender)
                .entryType(CREDIT_ENTRY)
                .amount(request.amount())
                .build();

        LedgerEntry receiverEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(receiver)
                .entryType(DEBIT_ENTRY)
                .amount(request.amount())
                .build();

        ledgerEntryRepository.saveAll(List.of(senderEntry, receiverEntry));

        return transaction;
    }

    private void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key header is required");
        }
    }

    private void validateTransfer(TransferRequest request, Account sender, Account receiver) {
        if (!sender.getCurrency().equals(request.currency()) || !receiver.getCurrency().equals(request.currency())) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        if (!ACTIVE_STATUS.equals(sender.getStatus()) || !ACTIVE_STATUS.equals(receiver.getStatus())) {
            if (FROZEN_STATUS.equals(sender.getStatus()) || FROZEN_STATUS.equals(receiver.getStatus())) {
                throw new IllegalStateException("Account is frozen");
            }
            throw new IllegalStateException("Account is not active");
        }
        if (sender.getBalance().compareTo(request.amount()) < 0) {
            throw new IllegalStateException("Insufficient balance");
        }
    }

    private void validateTransferRequest(TransferRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Transfer request is required");
        }
        if (request.fromAccountId() == null) {
            throw new IllegalArgumentException("Invalid sender account");
        }
        if (request.toAccountId() == null) {
            throw new IllegalArgumentException("Invalid receiver account");
        }
        if (request.amount() == null || request.amount().signum() <= 0) {
            throw new IllegalArgumentException("Transfer amount must be greater than zero");
        }
        if (request.currency() == null || request.currency().isBlank()) {
            throw new IllegalArgumentException("Currency is required");
        }
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new IllegalArgumentException("Sender and receiver accounts must be different");
        }
    }
}
