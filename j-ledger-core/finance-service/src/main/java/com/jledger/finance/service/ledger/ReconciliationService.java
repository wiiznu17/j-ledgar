package com.jledger.finance.service.ledger;

import com.jledger.finance.domain.entity.ReconciliationReport;
import java.time.LocalDate;
import java.util.List;

public interface ReconciliationService {
    void runNightlyReconciliation();
    ReconciliationReport runManualReconciliation(LocalDate reportDate);
    ReconciliationReport executeReconciliation(LocalDate reportDate);
    List<ReconciliationReport> getAllReports();
}
