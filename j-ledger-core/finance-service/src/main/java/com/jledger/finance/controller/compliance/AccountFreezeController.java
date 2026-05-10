package com.jledger.finance.controller.compliance;

import com.jledger.finance.service.compliance.AccountFreezeService;
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
    public ResponseEntity<Map<String, Object>> freezeAccount(
            @PathVariable Long walletId,
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
    public ResponseEntity<Map<String, Object>> unfreezeAccount(
            @PathVariable Long walletId,
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
    public ResponseEntity<Map<String, Object>> checkFrozenStatus(@PathVariable Long walletId) {
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
    public ResponseEntity<Map<String, Object>> freezeAccountDueToSuspiciousActivity(
            @PathVariable Long walletId,
            @RequestParam String suspiciousActivityId
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
    public ResponseEntity<Map<String, Object>> unfreezeAccountAfterInvestigation(
            @PathVariable Long walletId,
            @RequestParam String clearedBy
    ) {
        var wallet = accountFreezeService.unfreezeAccountAfterInvestigation(walletId, clearedBy);

        return ResponseEntity.ok(Map.of(
                "walletId", wallet.getId(),
                "status", wallet.getStatus(),
                "message", "Account unfrozen after investigation"
        ));
    }
}
