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
    List<Account> findByAccountType(com.jledger.finance.domain.enums.AccountType accountType);

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a")
    BigDecimal getSumOfAllBalances();

    @Query("SELECT COALESCE(SUM(a.balance), 0) FROM Account a WHERE a.id != :systemAccountId")
    BigDecimal getSumOfBalancesExcluding(@Param("systemAccountId") UUID systemAccountId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    java.util.Optional<Account> findByIdForUpdate(@Param("id") UUID id);

    @Query("SELECT a FROM Account a WHERE " +
           "(:status IS NULL OR :status = '' OR a.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR LOWER(a.accountName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "CAST(a.id AS string) LIKE CONCAT('%', :search, '%') OR " +
           "CAST(a.userId AS string) LIKE CONCAT('%', :search, '%') OR " +
           "(LOWER(:search) LIKE '%master%' AND CAST(a.userId AS string) = '00000000-0000-0000-0000-000000000000') OR " +
           "(LOWER(:search) LIKE '%treasury%' AND CAST(a.userId AS string) = '00000000-0000-0000-0000-000000000000'))")
    org.springframework.data.domain.Page<Account> findAllFiltered(
            @Param("status") String status,
            @Param("search") String search,
            org.springframework.data.domain.Pageable pageable);
}
