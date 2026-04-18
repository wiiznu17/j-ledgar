package com.jledger.core.service;

import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.repository.LedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LedgerQueryService {

    private final LedgerEntryRepository ledgerEntryRepository;

    @Transactional(readOnly = true)
    public Page<LedgerEntry> getAccountHistory(UUID accountId, int page, int size) {
        return ledgerEntryRepository.findHistoryByAccountId(accountId, PageRequest.of(page, size));
    }
}
