package com.jledger.finance.controller.compliance;

import com.jledger.finance.service.compliance.AccountFreezeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for account freeze/unfreeze operations.
 * These endpoints should be protected with proper authentication and authorization.
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Account Freeze API", description = "Endpoints for administrative freeze and unfreeze of wallets")
public class AccountFreezeController {

    private final AccountFreezeService accountFreezeService;

    /**
     * Freeze an account.
     *
     * @param walletId the wallet ID to freeze
     * @param body the request body containing reason and frozenBy information
     * @return the updated account status
     */
    @PostMapping("/{walletId}/freeze")
    @Operation(summary = "Freeze a wallet account", description = "Performs an administrative freeze on a wallet account by its internal ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account frozen successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Map<String, Object>> freezeAccount(
            @Parameter(description = "Wallet ID") @PathVariable Long walletId,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.getOrDefault("reason", "Administrative freeze");
        String frozenBy = body.getOrDefault("frozenBy", "ADMIN");

        var wallet = accountFreezeService.freezeAccount(walletId, reason, frozenBy);

        return ResponseEntity.ok(Map.of(
                "walletId", wallet.getId(),
                "status", wallet.getStatus(),
                "message", "Account frozen successfully"
        ));
    }

    /**
     * Unfreeze an account.
     *
     * @param walletId the wallet ID to unfreeze
     * @param body the request body containing reason and unfrozenBy information
     * @return the updated account status
     */
    @PostMapping("/{walletId}/unfreeze")
    @Operation(summary = "Unfreeze a wallet account", description = "Performs an administrative unfreeze on a wallet account by its internal ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account unfrozen successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Map<String, Object>> unfreezeAccount(
            @Parameter(description = "Wallet ID") @PathVariable Long walletId,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.getOrDefault("reason", "Administrative unfreeze");
        String unfrozenBy = body.getOrDefault("unfrozenBy", "ADMIN");

        var wallet = accountFreezeService.unfreezeAccount(walletId, reason, unfrozenBy);

        return ResponseEntity.ok(Map.of(
                "walletId", wallet.getId(),
                "status", wallet.getStatus(),
                "message", "Account unfrozen successfully"
        ));
    }

    /**
     * Check if an account is frozen.
     *
     * @param walletId the wallet ID to check
     * @return the frozen status
     */
    @GetMapping("/{walletId}/frozen-status")
    @Operation(summary = "Check if account is frozen", description = "Queries the frozen status of a wallet account")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Status retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Map<String, Object>> checkFrozenStatus(
            @Parameter(description = "Wallet ID") @PathVariable Long walletId) {
        boolean isFrozen = accountFreezeService.isAccountFrozen(walletId);

        return ResponseEntity.ok(Map.of(
                "walletId", walletId,
                "isFrozen", isFrozen
        ));
    }

    /**
     * Freeze an account due to suspicious activity.
     * This endpoint is typically called by the AML monitoring system.
     *
     * @param walletId the wallet ID to freeze
     * @param suspiciousActivityId the ID of the suspicious activity
     * @return the updated account status
     */
    @PostMapping("/{walletId}/freeze/suspicious-activity")
    @Operation(summary = "Freeze account due to suspicious activity", description = "Automatically freezes an account based on suspicious activity ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account frozen successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet or suspicious activity not found")
    })
    public ResponseEntity<Map<String, Object>> freezeAccountDueToSuspiciousActivity(
            @Parameter(description = "Wallet ID") @PathVariable Long walletId,
            @Parameter(description = "Suspicious activity ID") @RequestParam String suspiciousActivityId
    ) {
        var wallet = accountFreezeService.freezeAccountDueToSuspiciousActivity(walletId, suspiciousActivityId);

        return ResponseEntity.ok(Map.of(
                "walletId", wallet.getId(),
                "status", wallet.getStatus(),
                "message", "Account frozen due to suspicious activity"
        ));
    }

    /**
     * Unfreeze an account after investigation.
     * This endpoint is typically called after manual review or automated clearance.
     *
     * @param walletId the wallet ID to unfreeze
     * @param clearedBy the user or system that cleared the account
     * @return the updated account status
     */
    @PostMapping("/{walletId}/unfreeze/after-investigation")
    @Operation(summary = "Unfreeze account after investigation", description = "Unfreezes an account once the investigation is cleared by an auditor")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Account unfrozen successfully"),
            @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    public ResponseEntity<Map<String, Object>> unfreezeAccountAfterInvestigation(
            @Parameter(description = "Wallet ID") @PathVariable Long walletId,
            @Parameter(description = "Cleared by username/system") @RequestParam String clearedBy
    ) {
        var wallet = accountFreezeService.unfreezeAccountAfterInvestigation(walletId, clearedBy);

        return ResponseEntity.ok(Map.of(
                "walletId", wallet.getId(),
                "status", wallet.getStatus(),
                "message", "Account unfrozen after investigation"
        ));
    }
}
