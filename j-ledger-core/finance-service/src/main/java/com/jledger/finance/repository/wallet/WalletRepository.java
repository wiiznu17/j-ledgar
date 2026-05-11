package com.jledger.finance.repository.wallet;

import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.jledger.finance.domain.entity.Wallet;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUserId(String userId);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
    Optional<Wallet> findByUserIdForUpdate(String userId);

    boolean existsByUserId(String userId);
    Optional<Wallet> findByWalletId(String walletId);

    @Query("SELECT SUM(w.balance) FROM Wallet w")
    java.math.BigDecimal sumAllBalances();
}
