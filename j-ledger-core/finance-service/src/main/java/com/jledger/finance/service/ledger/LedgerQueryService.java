package com.jledger.finance.service.ledger;

import com.jledger.finance.domain.entity.LedgerEntry;
import com.jledger.finance.repository.ledger.LedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

// Legacy service - commented out during migration to wallet-based system
// @Service
// @RequiredArgsConstructor
// public class LedgerQueryService {
//
//     private final LedgerEntryRepository ledgerEntryRepository;
//
//     @Transactional(readOnly = true)
//     public Page<LedgerEntry> getAccountHistory(UUID accountId, int page, int size) {
//         return ledgerEntryRepository.findHistoryByAccountId(accountId, PageRequest.of(page, size));
//     }
// }
