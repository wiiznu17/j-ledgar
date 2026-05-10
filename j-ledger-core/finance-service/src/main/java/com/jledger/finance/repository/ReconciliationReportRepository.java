package com.jledger.finance.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.jledger.finance.domain.entity.ReconciliationReport;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface ReconciliationReportRepository extends JpaRepository<ReconciliationReport, UUID> {
    Optional<ReconciliationReport> findByReportDate(LocalDate reportDate);
}
