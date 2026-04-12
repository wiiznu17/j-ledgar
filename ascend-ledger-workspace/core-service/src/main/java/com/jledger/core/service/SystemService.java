package com.jledger.core.service;

import com.jledger.core.dto.ReconciliationSummary;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemService {

    private final AccountRepository accountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Transactional(readOnly = true)
    public ReconciliationSummary reconcile() {
        BigDecimal totalAccountBalances = accountRepository.getSumOfAllBalances();
        BigDecimal totalCredits = ledgerEntryRepository.sumAmountByEntryType("CREDIT");
        BigDecimal totalDebits = ledgerEntryRepository.sumAmountByEntryType("DEBIT");

        return ReconciliationSummary.builder()
                .totalAccountBalances(totalAccountBalances)
                .totalCredits(totalCredits)
                .totalDebits(totalDebits)
                .build();
    }
}
