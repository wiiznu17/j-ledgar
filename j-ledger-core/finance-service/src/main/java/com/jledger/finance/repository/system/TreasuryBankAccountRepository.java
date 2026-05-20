package com.jledger.finance.repository.system;

import com.jledger.finance.domain.entity.TreasuryBankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TreasuryBankAccountRepository extends JpaRepository<TreasuryBankAccount, Long> {
    Optional<TreasuryBankAccount> findByProvider(String provider);
    Optional<TreasuryBankAccount> findByAccountNumber(String accountNumber);
}
