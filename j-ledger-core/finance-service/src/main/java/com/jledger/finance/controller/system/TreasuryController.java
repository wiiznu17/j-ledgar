package com.jledger.finance.controller.system;

import com.jledger.finance.domain.entity.TreasuryPayout;
import com.jledger.finance.dto.StripePayoutConfirmedRequest;
import com.jledger.finance.dto.TreasurySummaryResponse;
import com.jledger.finance.service.system.TreasuryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/treasury")
@Tag(name = "Treasury Management API", description = "Administrative endpoints for payouts and liquidity tracking")
public class TreasuryController {
    private final TreasuryService treasuryService;

    public TreasuryController(TreasuryService treasuryService) {
        this.treasuryService = treasuryService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get treasury financial summary", description = "Retrieves statistics on system bank accounts, total deposits, and available liquidity")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Treasury summary retrieved successfully")
    })
    public ResponseEntity<TreasurySummaryResponse> getSummary() {
        return ResponseEntity.ok(treasuryService.getSummary());
    }

    @GetMapping("/payouts")
    @Operation(summary = "Get payout log history", description = "Retrieves a listing of administrative payouts processed from ledger pools")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Payout logs retrieved successfully")
    })
    public ResponseEntity<List<TreasuryPayout>> getPayoutHistory() {
        return ResponseEntity.ok(treasuryService.getPayoutHistory());
    }

    @PostMapping("/internal/payouts/stripe-confirmed")
    @Operation(summary = "Confirm Stripe payout", description = "Internal callback endpoint to mark Stripe payouts as successfully settled")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Stripe payout confirmed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid payload details")
    })
    public ResponseEntity<Void> recordStripePayout(@Valid @RequestBody StripePayoutConfirmedRequest request) {
        treasuryService.recordStripePayoutConfirmed(
            request.getStripePayoutId(),
            request.getAmount(),
            request.getArrivalDate()
        );
        return ResponseEntity.ok().build();
    }
}
