package com.jledger.finance.dto;

import com.jledger.finance.domain.LedgerEntry;
import com.jledger.finance.domain.Transaction;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDetailsDto {

    private Transaction transaction;
    private List<LedgerEntry> ledgerEntries;
}
