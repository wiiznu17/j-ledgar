package com.jledger.finance.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.jledger.finance.domain.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * Transaction monitoring hooks service.
 * Provides hooks for external systems to monitor transactions at different lifecycle stages.
 */
@Service
@Slf4j
public class TransactionMonitoringHooks {

    private final List<Consumer<Transaction>> preTransactionHooks = new ArrayList<>();
    private final List<Consumer<Transaction>> postTransactionHooks = new ArrayList<>();
    private final List<Consumer<Transaction>> transactionFailedHooks = new ArrayList<>();
    private final List<Consumer<TransactionMonitoringEvent>> monitoringHooks = new ArrayList<>();

    public void registerPreTransactionHook(Consumer<Transaction> hook) {
        preTransactionHooks.add(hook);
        log.info("Registered pre-transaction hook");
    }

    public void registerPostTransactionHook(Consumer<Transaction> hook) {
        postTransactionHooks.add(hook);
        log.info("Registered post-transaction hook");
    }

    public void registerTransactionFailedHook(Consumer<Transaction> hook) {
        transactionFailedHooks.add(hook);
        log.info("Registered transaction failed hook");
    }

    public void registerMonitoringHook(Consumer<TransactionMonitoringEvent> hook) {
        monitoringHooks.add(hook);
        log.info("Registered general monitoring hook");
    }

    public void invokePreTransactionHooks(Transaction transaction) {
        TransactionMonitoringEvent event = new TransactionMonitoringEvent(
                transaction.getTransactionId(),
                "PRE_TRANSACTION",
                transaction.getFromWalletId() != null ? transaction.getFromWalletId().toString() : null,
                transaction.getToWalletId() != null ? transaction.getToWalletId().toString() : null,
                transaction.getAmount(),
                "THB",
                LocalDateTime.now()
        );

        monitoringHooks.forEach(hook -> {
            try {
                hook.accept(event);
            } catch (Exception e) {
                log.error("Error in monitoring hook for PRE_TRANSACTION event", e);
            }
        });

        preTransactionHooks.forEach(hook -> {
            try {
                hook.accept(transaction);
            } catch (Exception e) {
                log.error("Error in pre-transaction hook", e);
            }
        });
    }

    public void invokePostTransactionHooks(Transaction transaction) {
        TransactionMonitoringEvent event = new TransactionMonitoringEvent(
                transaction.getTransactionId(),
                "POST_TRANSACTION",
                transaction.getFromWalletId() != null ? transaction.getFromWalletId().toString() : null,
                transaction.getToWalletId() != null ? transaction.getToWalletId().toString() : null,
                transaction.getAmount(),
                "THB",
                LocalDateTime.now()
        );

        monitoringHooks.forEach(hook -> {
            try {
                hook.accept(event);
            } catch (Exception e) {
                log.error("Error in monitoring hook for POST_TRANSACTION event", e);
            }
        });

        postTransactionHooks.forEach(hook -> {
            try {
                hook.accept(transaction);
            } catch (Exception e) {
                log.error("Error in post-transaction hook", e);
            }
        });
    }

    public void invokeTransactionFailedHooks(Transaction transaction) {
        TransactionMonitoringEvent event = new TransactionMonitoringEvent(
                transaction.getTransactionId(),
                "TRANSACTION_FAILED",
                transaction.getFromWalletId() != null ? transaction.getFromWalletId().toString() : null,
                transaction.getToWalletId() != null ? transaction.getToWalletId().toString() : null,
                transaction.getAmount(),
                "THB",
                LocalDateTime.now()
        );

        monitoringHooks.forEach(hook -> {
            try {
                hook.accept(event);
            } catch (Exception e) {
                log.error("Error in monitoring hook for TRANSACTION_FAILED event", e);
            }
        });

        transactionFailedHooks.forEach(hook -> {
            try {
                hook.accept(transaction);
            } catch (Exception e) {
                log.error("Error in transaction failed hook", e);
            }
        });
    }

    public record TransactionMonitoringEvent(
            String transactionId,
            String eventType,
            String fromAccountId,
            String toAccountId,
            BigDecimal amount,
            String currency,
            LocalDateTime timestamp
    ) {}
}
