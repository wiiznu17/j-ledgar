package com.jledger.core.dto;

import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
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
