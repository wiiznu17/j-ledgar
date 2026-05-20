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
           "(CAST(:endDate AS timestamp) IS NULL OR t.createdAt <= :endDate) AND " +
           "(:userId IS NULL OR EXISTS (SELECT w FROM Wallet w WHERE w.userId = :userId AND (w.id = t.fromWalletId OR w.id = t.toWalletId))) AND " +
           "(:reference IS NULL OR :reference = '' OR LOWER(t.transactionId) LIKE LOWER(CONCAT('%', :reference, '%')) OR (t.referenceId IS NOT NULL AND LOWER(t.referenceId) LIKE LOWER(CONCAT('%', :reference, '%')))) " +
           "ORDER BY t.createdAt DESC")
    org.springframework.data.domain.Page<Transaction> findAllWithFilters(
            @Param("status") TransactionStatus status,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("userId") String userId,
            @Param("reference") String reference,
            Pageable pageable
    );

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccountId = :accountId OR t.toAccountId = :accountId) ORDER BY t.createdAt DESC")
    List<Transaction> findByAccountId(@Param("accountId") java.util.UUID accountId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccountId = :accountId OR t.toAccountId = :accountId) AND t.type = :type ORDER BY t.createdAt DESC")
    List<Transaction> findByAccountIdAndType(@Param("accountId") java.util.UUID accountId, @Param("type") TransactionType type, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccountId = :accountId OR t.toAccountId = :accountId) AND t.createdAt >= :from AND t.createdAt <= :to ORDER BY t.createdAt DESC")
    List<Transaction> findByAccountIdAndDateRange(@Param("accountId") java.util.UUID accountId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccountId = :accountId OR t.toAccountId = :accountId) AND t.type = :type AND t.createdAt >= :from AND t.createdAt <= :to ORDER BY t.createdAt DESC")
    List<Transaction> findByAccountIdAndTypeAndDateRange(@Param("accountId") java.util.UUID accountId, @Param("type") TransactionType type, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

    Optional<Transaction> findByTransactionId(String transactionId);
    Optional<Transaction> findByReferenceId(String referenceId);
    
    // For AML monitoring
    long countByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    List<Long> findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    
    // For fraud detection
    List<Transaction> findByFromWalletIdAndCreatedAtAfter(Long fromWalletId, LocalDateTime createdAt);
    
    // For data retention
    long countByCreatedAtBefore(LocalDateTime createdAt);
    long deleteByCreatedAtBefore(LocalDateTime createdAt);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.type = :type AND t.status = :status")
    java.math.BigDecimal sumAmountByTypeAndStatus(@Param("type") TransactionType type, @Param("status") TransactionStatus status);
}
