package com.jledger.core.controller;

import com.jledger.core.domain.ReconciliationReport;
import com.jledger.core.service.ReconciliationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/system/reconcile")
@RequiredArgsConstructor
@Tag(name = "Reconciliation API", description = "Internal endpoints for financial integrity monitoring")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Get reconciliation reports", description = "Retrieves a history of nightly reconciliation audits.")
    public ResponseEntity<List<ReconciliationReport>> getReports() {
        return ResponseEntity.ok(reconciliationService.getAllReports());
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'INTERNAL')")
    @Operation(summary = "Trigger reconciliation", description = "Manually triggers a reconciliation audit for the current date.")
    public ResponseEntity<ReconciliationReport> triggerReconciliation() {
        // To ensure we can test easily, we reconcile for the current date when triggered manually
        return ResponseEntity.ok(reconciliationService.executeReconciliation(LocalDate.now()));
    }
}
