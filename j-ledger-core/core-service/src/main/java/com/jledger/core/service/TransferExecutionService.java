package com.jledger.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.core.domain.Account;
import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.dto.TransferCompletedEvent;
import com.jledger.core.dto.TransferRequest;
import com.jledger.core.exception.AccountFrozenException;
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
        // 1. Validate account existence first to avoid FK violations during reservation
        Account sender = accountRepository.findById(request.fromAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender account not found"));

        Account receiver = accountRepository.findById(request.toAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver account not found"));

        // 2. Reserve the transaction (inserts or retrieves based on idempotency key)
        Transaction transaction = reserveTransaction(idempotencyKey, request, normalizedAmount);
        if (SUCCESS_STATUS.equals(transaction.getStatus())) {
            return transaction;
        }

        // 3. Complete the transfer processing
        return processTransfer(transaction, sender, receiver, normalizedAmount);
    }

    /** @implNote Called only by {@link TransferService} — not part of the public API contract. */
    void validateIdempotentReplay(
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

    private Transaction processTransfer(Transaction transaction, Account sender, Account receiver, BigDecimal normalizedAmount) {
        validateTransfer(sender, receiver, normalizedAmount);

        sender.withdraw(normalizedAmount);
        receiver.deposit(normalizedAmount);

        // Explicitly save updated balances
        accountRepository.saveAll(List.of(sender, receiver));
        accountRepository.flush();

        LedgerEntry senderEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(sender)
                .entryType(DEBIT_ENTRY)  // Money leaves sender
                .amount(normalizedAmount)
                .build();

        LedgerEntry receiverEntry = LedgerEntry.builder()
                .transaction(transaction)
                .account(receiver)
                .entryType(CREDIT_ENTRY)  // Money enters receiver
                .amount(normalizedAmount)
                .build();

        ledgerEntryRepository.saveAll(List.of(senderEntry, receiverEntry));
        transaction.setStatus(SUCCESS_STATUS);

        // Dual-Event Strategy: Record outbox entries for both sides of the transaction
        integrationOutboxRepository.save(IntegrationOutbox.builder()
                .eventType("DEBIT_EVENT")
                .payload(buildWalletEventPayload(transaction, sender.getId(), DEBIT_ENTRY))
                .status(PENDING_STATUS)
                .build());

        integrationOutboxRepository.save(IntegrationOutbox.builder()
                .eventType("CREDIT_EVENT")
                .payload(buildWalletEventPayload(transaction, receiver.getId(), CREDIT_ENTRY))
                .status(PENDING_STATUS)
                .build());

        return transaction;
    }

    private JsonNode buildWalletEventPayload(Transaction transaction, UUID accountId, String entryType) {
        return objectMapper.valueToTree(new WalletTransactionEvent(
                transaction.getId(),
                accountId,
                entryType,
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getCreatedAt()
        ));
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
            Account sender,
            Account receiver,
            BigDecimal normalizedAmount
    ) {
        // Simple currency check between accounts. 
        // Note: TransferService already validates that request.currency() matches normalizedAmount logic.
        if (!sender.getCurrency().equals(receiver.getCurrency())) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        if (!ACTIVE_STATUS.equals(sender.getStatus()) || !ACTIVE_STATUS.equals(receiver.getStatus())) {
            if (FROZEN_STATUS.equals(sender.getStatus())) {
                throw new AccountFrozenException("Sender account is frozen");
            }
            if (FROZEN_STATUS.equals(receiver.getStatus())) {
                throw new AccountFrozenException("Receiver account is frozen");
            }
            throw new ConflictException("Account is not active");
        }
        if (sender.getBalance().compareTo(normalizedAmount) < 0) {
            throw new ConflictException("Insufficient balance");
        }
    }

    private JsonNode buildTransferPayload(Transaction transaction) {
        return objectMapper.valueToTree(new TransferCompletedEvent(
                transaction.getId(),
                transaction.getIdempotencyKey(),
                transaction.getFromAccountId(),
                transaction.getToAccountId(),
                transaction.getTransactionType(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        ));
    }
}
