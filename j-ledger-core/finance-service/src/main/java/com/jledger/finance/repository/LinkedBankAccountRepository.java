package com.jledger.finance.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jledger.finance.domain.entity.LinkedBankAccount;

import java.util.List;
import java.util.Optional;

@Repository
public interface LinkedBankAccountRepository extends JpaRepository<LinkedBankAccount, Long> {
    List<LinkedBankAccount> findByUserIdOrderByIsDefaultDescCreatedAtAsc(String userId);
    Optional<LinkedBankAccount> findByUserIdAndIsDefaultTrue(String userId);
    Optional<LinkedBankAccount> findByIdAndUserId(Long id, String userId);
    boolean existsByUserId(String userId);
}
