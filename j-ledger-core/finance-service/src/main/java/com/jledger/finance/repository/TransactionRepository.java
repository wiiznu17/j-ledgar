package com.jledger.finance.repository;

import com.jledger.finance.model.Transaction;
import com.jledger.finance.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByFromWalletId(Long fromWalletId);
    List<Transaction> findByToWalletId(Long toWalletId);
    List<Transaction> findByFromWalletIdOrToWalletId(Long fromWalletId, Long toWalletId);
    List<Transaction> findByToWalletIdAndType(Long toWalletId, TransactionType type);
    
    // For AML monitoring
    long countByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    List<Long> findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    
    // For fraud detection
    List<Transaction> findByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    
    // For data retention
    long countByCreatedAtBefore(LocalDateTime createdAt);
    long deleteByCreatedAtBefore(LocalDateTime createdAt);
}
