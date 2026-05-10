package com.jledger.finance.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jledger.finance.domain.entity.RewardAccount;

import java.util.UUID;

@Repository
public interface RewardAccountRepository extends JpaRepository<RewardAccount, UUID> {
}
