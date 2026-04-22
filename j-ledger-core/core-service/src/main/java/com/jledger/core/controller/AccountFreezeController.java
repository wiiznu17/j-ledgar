package com.jledger.core.controller;

import com.jledger.core.service.AccountFreezeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

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
     * @param accountId the account ID to freeze
     * @param body the request body containing reason and frozenBy information
     * @return the updated account status
     */
    @PostMapping("/{accountId}/freeze")
    public ResponseEntity<Map<String, Object>> freezeAccount(
            @PathVariable UUID accountId,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.getOrDefault("reason", "Administrative freeze");
        String frozenBy = body.getOrDefault("frozenBy", "ADMIN");

        var account = accountFreezeService.freezeAccount(accountId, reason, frozenBy);

        return ResponseEntity.ok(Map.of(
                "accountId", account.getId(),
                "status", account.getStatus(),
                "message", "Account frozen successfully"
        ));
    }

    /**
     * Unfreeze an account.
     *
     * @param accountId the account ID to unfreeze
     * @param body the request body containing reason and unfrozenBy information
     * @return the updated account status
     */
    @PostMapping("/{accountId}/unfreeze")
    public ResponseEntity<Map<String, Object>> unfreezeAccount(
            @PathVariable UUID accountId,
            @RequestBody Map<String, String> body
    ) {
        String reason = body.getOrDefault("reason", "Administrative unfreeze");
        String unfrozenBy = body.getOrDefault("unfrozenBy", "ADMIN");

        var account = accountFreezeService.unfreezeAccount(accountId, reason, unfrozenBy);

        return ResponseEntity.ok(Map.of(
                "accountId", account.getId(),
                "status", account.getStatus(),
                "message", "Account unfrozen successfully"
        ));
    }

    /**
     * Check if an account is frozen.
     *
     * @param accountId the account ID to check
     * @return the frozen status
     */
    @GetMapping("/{accountId}/frozen-status")
    public ResponseEntity<Map<String, Object>> checkFrozenStatus(@PathVariable UUID accountId) {
        boolean isFrozen = accountFreezeService.isAccountFrozen(accountId);

        return ResponseEntity.ok(Map.of(
                "accountId", accountId,
                "isFrozen", isFrozen
        ));
    }

    /**
     * Freeze an account due to suspicious activity.
     * This endpoint is typically called by the AML monitoring system.
     *
     * @param accountId the account ID to freeze
     * @param suspiciousActivityId the ID of the suspicious activity
     * @return the updated account status
     */
    @PostMapping("/{accountId}/freeze/suspicious-activity")
    public ResponseEntity<Map<String, Object>> freezeAccountDueToSuspiciousActivity(
            @PathVariable UUID accountId,
            @RequestParam String suspiciousActivityId
    ) {
        var account = accountFreezeService.freezeAccountDueToSuspiciousActivity(accountId, suspiciousActivityId);

        return ResponseEntity.ok(Map.of(
                "accountId", account.getId(),
                "status", account.getStatus(),
                "message", "Account frozen due to suspicious activity"
        ));
    }

    /**
     * Unfreeze an account after investigation.
     * This endpoint is typically called after manual review or automated clearance.
     *
     * @param accountId the account ID to unfreeze
     * @param clearedBy the user or system that cleared the account
     * @return the updated account status
     */
    @PostMapping("/{accountId}/unfreeze/after-investigation")
    public ResponseEntity<Map<String, Object>> unfreezeAccountAfterInvestigation(
            @PathVariable UUID accountId,
            @RequestParam String clearedBy
    ) {
        var account = accountFreezeService.unfreezeAccountAfterInvestigation(accountId, clearedBy);

        return ResponseEntity.ok(Map.of(
                "accountId", account.getId(),
                "status", account.getStatus(),
                "message", "Account unfrozen after investigation"
        ));
    }
}
