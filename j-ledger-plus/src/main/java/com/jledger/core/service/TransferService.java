package com.jledger.core.service;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.exception.ResourceNotFoundException;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransferService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String FROZEN_STATUS = "FROZEN";
    private static final String TRANSFER_TYPE = "TRANSFER";
    private static final String PENDING_STATUS = "PENDING";
    private static final String SUCCESS_STATUS = "SUCCESS";
    private static final String DEBIT_ENTRY = "DEBIT";
    private static final String CREDIT_ENTRY = "CREDIT";
    private static final int MONETARY_SCALE = 4;

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Transactional
    public Transaction executeTransfer(String idempotencyKey, TransferRequest request) {
        validateIdempotencyKey(idempotencyKey);
        validateTransferRequest(request);
        BigDecimal normalizedAmount = normalizeAmount(request.amount());

        Transaction transaction = reserveTransaction(idempotencyKey, request, normalizedAmount);
        if (SUCCESS_STATUS.equals(transaction.getStatus())) {
            return transaction;
        }

        return processTransfer(transaction, request, normalizedAmount);
    }

    private Transaction processTransfer(Transaction transaction, TransferRequest request, BigDecimal normalizedAmount) {
        Account sender = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender account not found"));

        Account receiver = accountRepository.findById(request.toAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver account not found"));

        validateTransfer(request, sender, receiver, normalizedAmount);

        sender.withdraw(normalizedAmount);
        receiver.deposit(normalizedAmount);

        // Force the optimistic-lock version check before writing dependent records.
        accountRepository.flush();

        LedgerEntry senderEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(sender)
                .entryType(CREDIT_ENTRY)
                .amount(normalizedAmount)
                .build();

        LedgerEntry receiverEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(receiver)
                .entryType(DEBIT_ENTRY)
                .amount(normalizedAmount)
                .build();

        ledgerEntryRepository.saveAll(List.of(senderEntry, receiverEntry));
        transaction.setStatus(SUCCESS_STATUS);

        return transaction;
    }

    private Transaction reserveTransaction(String idempotencyKey, TransferRequest request, BigDecimal normalizedAmount) {
        UUID transactionId = UUID.randomUUID();
        int insertedRows = transactionRepository.insertIfAbsent(
                transactionId,
                idempotencyKey,
                request.fromAccountId(),
                request.toAccountId(),
                TRANSFER_TYPE,
                normalizedAmount,
                request.currency(),
                PENDING_STATUS
        );

        if (insertedRows == 1) {
            return transactionRepository.findById(transactionId)
                    .orElseThrow(() -> new ConflictException("Reserved transaction could not be reloaded"));
        }

        Transaction existingTransaction = transactionRepository.findByIdempotencyKey(idempotencyKey)
                .orElseThrow(() -> new ConflictException("Duplicate Idempotency-Key detected"));

        validateIdempotentReplay(existingTransaction, request, normalizedAmount);
        return existingTransaction;
    }

    private void validateIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key header is required");
        }
    }

    private void validateTransfer(
            TransferRequest request,
            Account sender,
            Account receiver,
            BigDecimal normalizedAmount
    ) {
        if (!sender.getCurrency().equals(request.currency()) || !receiver.getCurrency().equals(request.currency())) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        if (!ACTIVE_STATUS.equals(sender.getStatus()) || !ACTIVE_STATUS.equals(receiver.getStatus())) {
            if (FROZEN_STATUS.equals(sender.getStatus()) || FROZEN_STATUS.equals(receiver.getStatus())) {
                throw new ConflictException("Account is frozen");
            }
            throw new ConflictException("Account is not active");
        }
        if (sender.getBalance().compareTo(normalizedAmount) < 0) {
            throw new ConflictException("Insufficient balance");
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
        if (request.currency() == null || !request.currency().matches("^[A-Z]{3}$")) {
            throw new IllegalArgumentException("Currency must be a 3-letter uppercase code");
        }
        if (request.fromAccountId().equals(request.toAccountId())) {
            throw new IllegalArgumentException("Sender and receiver accounts must be different");
        }
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        try {
            return amount.setScale(MONETARY_SCALE, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new IllegalArgumentException("Transfer amount must have up to 4 decimal places", exception);
        }
    }

    private void validateIdempotentReplay(
            Transaction existingTransaction,
            TransferRequest request,
            BigDecimal normalizedAmount
    ) {
        boolean sameRequest = TRANSFER_TYPE.equals(existingTransaction.getTransactionType())
                && request.fromAccountId().equals(existingTransaction.getFromAccountId())
                && request.toAccountId().equals(existingTransaction.getToAccountId())
                && existingTransaction.getAmount().compareTo(normalizedAmount) == 0
                && existingTransaction.getCurrency().equals(request.currency());

        if (!sameRequest) {
            throw new ConflictException("Idempotency-Key cannot be reused with a different transfer request");
        }
        if (!SUCCESS_STATUS.equals(existingTransaction.getStatus())) {
            throw new ConflictException("Transfer with this Idempotency-Key is already being processed");
        }
    }
}
