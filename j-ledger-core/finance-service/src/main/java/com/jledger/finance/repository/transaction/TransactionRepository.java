package com.jledger.finance.repository.transaction;

import com.jledger.finance.domain.entity.Transaction;
import com.jledger.finance.domain.enums.TransactionStatus;
import com.jledger.finance.domain.enums.TransactionType;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    @Query("SELECT t FROM Transaction t WHERE " +
           "(CAST(:status AS string) IS NULL OR t.status = :status) AND " +
           "(CAST(:type AS string) IS NULL OR t.type = :type) AND " +
           "(CAST(:startDate AS timestamp) IS NULL OR t.createdAt >= :startDate) AND " +
           "(CAST(:endDate AS timestamp) IS NULL OR t.createdAt <= :endDate) " +
           "ORDER BY t.createdAt DESC")
    org.springframework.data.domain.Page<Transaction> findAllWithFilters(
            @Param("status") TransactionStatus status,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

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
