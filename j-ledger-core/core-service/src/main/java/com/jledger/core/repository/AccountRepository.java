package com.jledger.core.repository;

import com.jledger.core.domain.Account;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByUserId(UUID userId);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a")
    BigDecimal getSumOfAllBalances();
}
