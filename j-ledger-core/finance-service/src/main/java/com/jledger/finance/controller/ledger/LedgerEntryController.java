package com.jledger.finance.controller.ledger;

import com.jledger.finance.domain.entity.LedgerEntry;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ledger-entries")
@RequiredArgsConstructor
@Tag(name = "Ledger Entry API", description = "Endpoints for auditing financial entries")
public class LedgerEntryController {

    private final LedgerEntryRepository ledgerEntryRepository;

    @GetMapping("/account/{accountId}")
    @Transactional(readOnly = true)
    @Operation(summary = "Get ledger entries for an account", description = "Returns a paginated list of credit/debit entries for a specific internal account")
    public ResponseEntity<Page<LedgerEntry>> getHistoryByAccountId(
            @PathVariable UUID accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Page<LedgerEntry> history = ledgerEntryRepository.findHistoryByAccountId(accountId, PageRequest.of(page, size));
        return ResponseEntity.ok(history);
    }
}
