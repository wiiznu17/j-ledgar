package com.jledger.core.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationSummary {

    private BigDecimal totalAccountBalances;
    private BigDecimal totalCredits;
    private BigDecimal totalDebits;
}
