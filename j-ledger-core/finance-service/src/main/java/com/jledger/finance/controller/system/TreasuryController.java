package com.jledger.finance.controller.system;

import com.jledger.finance.domain.entity.TreasuryPayout;
import com.jledger.finance.dto.StripePayoutConfirmedRequest;
import com.jledger.finance.dto.TreasurySummaryResponse;
import com.jledger.finance.service.system.TreasuryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/treasury")
public class TreasuryController {
    private final TreasuryService treasuryService;

    public TreasuryController(TreasuryService treasuryService) {
        this.treasuryService = treasuryService;
    }

    @GetMapping("/summary")
    public ResponseEntity<TreasurySummaryResponse> getSummary() {
        return ResponseEntity.ok(treasuryService.getSummary());
    }

    @GetMapping("/payouts")
    public ResponseEntity<List<TreasuryPayout>> getPayoutHistory() {
        return ResponseEntity.ok(treasuryService.getPayoutHistory());
    }

    // Internal API for portal-service to confirm Stripe payouts
    @PostMapping("/internal/payouts/stripe-confirmed")
    public ResponseEntity<Void> recordStripePayout(@RequestBody StripePayoutConfirmedRequest request) {
        treasuryService.recordStripePayoutConfirmed(
            request.getStripePayoutId(),
            request.getAmount(),
            request.getArrivalDate()
        );
        return ResponseEntity.ok().build();
    }
}
