package com.jledger.finance.repository;

import com.jledger.finance.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUserId(String userId);
    boolean existsByUserId(String userId);
    Optional<Wallet> findByWalletId(String walletId);
}
