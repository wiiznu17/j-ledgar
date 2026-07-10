package com.jledger.finance.service.system;

import com.jledger.finance.domain.entity.TreasuryPayout;
import com.jledger.finance.dto.TreasurySummaryResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface TreasuryService {
    TreasurySummaryResponse getSummary();
    void recordStripePayoutConfirmed(String stripePayoutId, BigDecimal amount, LocalDateTime arrivalDate);
    List<TreasuryPayout> getPayoutHistory();
}
