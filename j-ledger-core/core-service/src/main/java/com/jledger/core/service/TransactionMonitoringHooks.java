package com.jledger.core.service;

import com.jledger.core.domain.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

/**
 * Transaction monitoring hooks service.
 * Provides hooks for external systems to monitor transactions at different lifecycle stages.
 * 
 * This service implements the observer pattern to allow multiple monitoring systems
 * to hook into transaction events without coupling them directly to the transaction processing logic.
 */
@Service
@Slf4j
public class TransactionMonitoringHooks {

    private final List<Consumer<Transaction>> preTransactionHooks = new ArrayList<>();
    private final List<Consumer<Transaction>> postTransactionHooks = new ArrayList<>();
    private final List<Consumer<Transaction>> transactionFailedHooks = new ArrayList<>();
    private final List<Consumer<TransactionMonitoringEvent>> monitoringHooks = new ArrayList<>();

    /**
     * Registers a hook to be called before a transaction is executed.
     *
     * @param hook the hook function
     */
    public void registerPreTransactionHook(Consumer<Transaction> hook) {
        preTransactionHooks.add(hook);
        log.info("Registered pre-transaction hook");
    }

    /**
     * Registers a hook to be called after a transaction is successfully executed.
     *
     * @param hook the hook function
     */
    public void registerPostTransactionHook(Consumer<Transaction> hook) {
        postTransactionHooks.add(hook);
        log.info("Registered post-transaction hook");
    }

    /**
     * Registers a hook to be called when a transaction fails.
     *
     * @param hook the hook function
     */
    public void registerTransactionFailedHook(Consumer<Transaction> hook) {
        transactionFailedHooks.add(hook);
        log.info("Registered transaction failed hook");
    }

    /**
     * Registers a general monitoring hook for all transaction events.
     *
     * @param hook the hook function
     */
    public void registerMonitoringHook(Consumer<TransactionMonitoringEvent> hook) {
        monitoringHooks.add(hook);
        log.info("Registered general monitoring hook");
    }

    /**
     * Invokes all pre-transaction hooks.
     *
     * @param transaction the transaction about to be executed
     */
    public void invokePreTransactionHooks(Transaction transaction) {
        TransactionMonitoringEvent event = new TransactionMonitoringEvent(
                transaction.getId(),
                "PRE_TRANSACTION",
                transaction.getFromAccountId(),
                transaction.getToAccountId(),
                transaction.getAmount(),
                transaction.getCurrency(),
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

    /**
     * Invokes all post-transaction hooks.
     *
     * @param transaction the transaction that was successfully executed
     */
    public void invokePostTransactionHooks(Transaction transaction) {
        TransactionMonitoringEvent event = new TransactionMonitoringEvent(
                transaction.getId(),
                "POST_TRANSACTION",
                transaction.getFromAccountId(),
                transaction.getToAccountId(),
                transaction.getAmount(),
                transaction.getCurrency(),
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

    /**
     * Invokes all transaction failed hooks.
     *
     * @param transaction the transaction that failed
     */
    public void invokeTransactionFailedHooks(Transaction transaction) {
        TransactionMonitoringEvent event = new TransactionMonitoringEvent(
                transaction.getId(),
                "TRANSACTION_FAILED",
                transaction.getFromAccountId(),
                transaction.getToAccountId(),
                transaction.getAmount(),
                transaction.getCurrency(),
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

    /**
     * Transaction monitoring event data class.
     */
    public record TransactionMonitoringEvent(
            UUID transactionId,
            String eventType,
            UUID fromAccountId,
            UUID toAccountId,
            BigDecimal amount,
            String currency,
            LocalDateTime timestamp
    ) {}
}
