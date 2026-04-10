package com.jledger.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jledger.core.domain.Account;
import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.ConflictException;
import com.jledger.core.exception.ResourceNotFoundException;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransferExecutionService {

    private static final String ACTIVE_STATUS = "ACTIVE";
    private static final String FROZEN_STATUS = "FROZEN";
    private static final String TRANSFER_TYPE = "TRANSFER";
    private static final String PENDING_STATUS = "PENDING";
    private static final String SUCCESS_STATUS = "SUCCESS";
    private static final String DEBIT_ENTRY = "DEBIT";
    private static final String CREDIT_ENTRY = "CREDIT";
    private static final String OUTBOX_EVENT_TYPE = "TRANSFER_COMPLETED";

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final IntegrationOutboxRepository integrationOutboxRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Transaction performTransferInDb(
            String idempotencyKey,
            TransferRequest request,
            BigDecimal normalizedAmount
    ) {
        Transaction transaction = reserveTransaction(idempotencyKey, request, normalizedAmount);
        if (SUCCESS_STATUS.equals(transaction.getStatus())) {
            return transaction;
        }

        return processTransfer(transaction, request, normalizedAmount);
    }

    public void validateIdempotentReplay(
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

    private Transaction processTransfer(Transaction transaction, TransferRequest request, BigDecimal normalizedAmount) {
        Account sender = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender account not found"));

        Account receiver = accountRepository.findById(request.toAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver account not found"));

        validateTransfer(request, sender, receiver, normalizedAmount);

        sender.withdraw(normalizedAmount);
        receiver.deposit(normalizedAmount);

        // Preserve the existing optimistic-lock guard before creating dependent records.
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
        integrationOutboxRepository.save(IntegrationOutbox.builder()
                .eventType(OUTBOX_EVENT_TYPE)
                .payload(buildTransferPayload(transaction))
                .status(PENDING_STATUS)
                .build());

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

    private JsonNode buildTransferPayload(Transaction transaction) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("transactionId", transaction.getId().toString());
        payload.put("idempotencyKey", transaction.getIdempotencyKey());
        payload.put("fromAccountId", transaction.getFromAccountId().toString());
        payload.put("toAccountId", transaction.getToAccountId().toString());
        payload.put("transactionType", transaction.getTransactionType());
        payload.put("amount", transaction.getAmount().toPlainString());
        payload.put("currency", transaction.getCurrency());
        payload.put("status", transaction.getStatus());

        if (transaction.getCreatedAt() != null) {
            payload.put("createdAt", transaction.getCreatedAt().toString());
        }

        return payload;
    }
}
