package com.jledger.finance.repository;

import com.jledger.finance.domain.Transaction;
import com.jledger.finance.domain.TransactionType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByFromWalletId(Long fromWalletId);
    List<Transaction> findByToWalletId(Long toWalletId);
    List<Transaction> findByFromWalletIdOrToWalletId(Long fromWalletId, Long toWalletId);
    List<Transaction> findByFromWalletIdOrToWalletIdOrderByCreatedAtDesc(Long fromWalletId, Long toWalletId);
    List<Transaction> findByFromWalletIdOrToWalletIdAndTypeOrderByCreatedAtDesc(
            Long fromWalletId,
            Long toWalletId,
            TransactionType type
    );
    List<Transaction> findByFromWalletIdOrToWalletIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long fromWalletId,
            Long toWalletId,
            LocalDateTime from,
            LocalDateTime to
    );
    List<Transaction> findByFromWalletIdOrToWalletIdAndTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long fromWalletId,
            Long toWalletId,
            TransactionType type,
            LocalDateTime from,
            LocalDateTime to
    );
    List<Transaction> findByFromWalletIdOrToWalletIdOrderByCreatedAtDesc(Long fromWalletId, Long toWalletId, Pageable pageable);
    List<Transaction> findByFromWalletIdOrToWalletIdAndTypeOrderByCreatedAtDesc(
            Long fromWalletId,
            Long toWalletId,
            TransactionType type,
            Pageable pageable
    );
    List<Transaction> findByFromWalletIdOrToWalletIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long fromWalletId,
            Long toWalletId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );
    List<Transaction> findByFromWalletIdOrToWalletIdAndTypeAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long fromWalletId,
            Long toWalletId,
            TransactionType type,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );
    List<Transaction> findByToWalletIdAndType(Long toWalletId, TransactionType type);
    List<Transaction> findByToWalletIdAndTypeOrderByCreatedAtDesc(Long toWalletId, TransactionType type);
    Optional<Transaction> findByTransactionId(String transactionId);
    
    // For AML monitoring
    long countByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    List<Long> findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    
    // For fraud detection
    List<Transaction> findByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    
    // For data retention
    long countByCreatedAtBefore(LocalDateTime createdAt);
    long deleteByCreatedAtBefore(LocalDateTime createdAt);
}
