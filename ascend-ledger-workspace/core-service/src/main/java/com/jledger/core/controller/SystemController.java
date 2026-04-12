package com.jledger.core.controller;

import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.dto.ReconciliationSummary;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.service.SystemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
    @Operation(summary = "Reconcile system", description = "Calculates total balances and ledger entries to detect discrepancies")
    public ResponseEntity<ReconciliationSummary> reconcile() {
        return ResponseEntity.ok(systemService.reconcile());
    }
}
