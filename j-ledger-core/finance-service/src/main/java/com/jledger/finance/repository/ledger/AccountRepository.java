package com.jledger.finance.repository.ledger;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jledger.finance.domain.entity.Account;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a")
    BigDecimal getSumOfAllBalances();

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.id != :systemAccountId")
    BigDecimal getSumOfBalancesExcluding(@Param("systemAccountId") UUID systemAccountId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    java.util.Optional<Account> findByIdForUpdate(@Param("id") UUID id);
}
