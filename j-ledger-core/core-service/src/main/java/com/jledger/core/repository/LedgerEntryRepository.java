package com.jledger.core.repository;

import com.jledger.core.domain.LedgerEntry;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.math.BigDecimal;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.ZonedDateTime;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {

    List<LedgerEntry> findByTransactionId(UUID transactionId);

    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM LedgerEntry l WHERE l.entryType = :entryType")
    BigDecimal sumAmountByEntryType(@Param("entryType") String entryType);

    @Query(
        value = "SELECT le FROM LedgerEntry le JOIN FETCH le.transaction t " +
                "WHERE le.account.id = :accountId " +
                "ORDER BY le.createdAt DESC",
        countQuery = "SELECT COUNT(le) FROM LedgerEntry le WHERE le.account.id = :accountId"
    )
    Page<LedgerEntry> findHistoryByAccountId(@Param("accountId") UUID accountId, Pageable pageable);
}
