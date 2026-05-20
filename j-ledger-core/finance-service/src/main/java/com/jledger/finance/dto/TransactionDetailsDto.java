package com.jledger.finance.dto;

import com.jledger.finance.domain.entity.LedgerEntry;
import com.jledger.finance.domain.entity.Transaction;

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
