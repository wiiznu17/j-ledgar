package com.jledger.finance.repository.ledger;

import com.jledger.finance.domain.entity.ReconciliationReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationReportRepository extends JpaRepository<ReconciliationReport, UUID> {
    Optional<ReconciliationReport> findByReportDate(LocalDate reportDate);
    
    @Query("SELECT r FROM ReconciliationReport r ORDER BY r.reportDate DESC, r.createdAt DESC")
    List<ReconciliationReport> findAllOrderByDateDesc();
}
