package com.jledger.core.controller;

import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.domain.SystemSettings;
import com.jledger.core.dto.ReconciliationSummary;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.service.SystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Tag(name = "System API", description = "Endpoints for system operations and reconciliation")
public class SystemController {

    private final SystemService systemService;
    private final IntegrationOutboxRepository outboxRepository;

    @GetMapping("/outbox")
    @Operation(summary = "List outbox items", description = "Returns all integration outbox records")
    public ResponseEntity<List<IntegrationOutbox>> listOutbox() {
        return ResponseEntity.ok(outboxRepository.findAll());
    }

    @PostMapping("/reconcile")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'RECONCILER', 'INTERNAL')")
    @Operation(summary = "Reconcile system", description = "Calculates total balances and ledger entries to detect discrepancies")
    public ResponseEntity<ReconciliationSummary> reconcile() {
        return ResponseEntity.ok(systemService.reconcile());
    }

    // Settings Endpoints
    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Get system settings", description = "Returns all system settings")
    public ResponseEntity<SystemSettings> getSystemSettings() {
        return ResponseEntity.ok(systemService.getSystemSettings());
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Update system settings", description = "Updates system settings")
    public ResponseEntity<SystemSettings> updateSystemSettings(@RequestBody SystemSettings settings) {
        return ResponseEntity.ok(systemService.updateSystemSettings(settings));
    }

    @GetMapping("/settings/fees")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Get fee configuration", description = "Returns fee configuration")
    public ResponseEntity<Map<String, Object>> getFeeConfiguration() {
        return ResponseEntity.ok(systemService.getFeeConfiguration());
    }

    @PutMapping("/settings/fees")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Update fee configuration", description = "Updates fee configuration")
    public ResponseEntity<Map<String, Object>> updateFeeConfiguration(@RequestBody Map<String, Object> fees) {
        return ResponseEntity.ok(systemService.updateFeeConfiguration(fees));
    }

    @GetMapping("/settings/limits")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Get limit configuration", description = "Returns limit configuration")
    public ResponseEntity<Map<String, Object>> getLimitConfiguration() {
        return ResponseEntity.ok(systemService.getLimitConfiguration());
    }

    @PutMapping("/settings/limits")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Update limit configuration", description = "Updates limit configuration")
    public ResponseEntity<Map<String, Object>> updateLimitConfiguration(@RequestBody Map<String, Object> limits) {
        return ResponseEntity.ok(systemService.updateLimitConfiguration(limits));
    }
}
