package com.jledger.core.repository;

import com.jledger.core.domain.RewardAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface RewardAccountRepository extends JpaRepository<RewardAccount, UUID> {
}
