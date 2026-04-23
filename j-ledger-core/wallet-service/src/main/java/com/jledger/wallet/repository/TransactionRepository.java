package com.jledger.wallet.repository;

import com.jledger.wallet.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByFromWalletId(String fromWalletId);
    List<Transaction> findByToWalletId(String toWalletId);
    List<Transaction> findByFromWalletIdOrToWalletId(String fromWalletId, String toWalletId);
}
