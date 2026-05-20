package com.jledger.finance.repository.system;

import com.jledger.finance.domain.entity.TreasuryPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TreasuryPayoutRepository extends JpaRepository<TreasuryPayout, Long> {
    Optional<TreasuryPayout> findByStripePayoutId(String stripePayoutId);
}
