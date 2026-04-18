package com.jledger.core.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "reconciliation_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReconciliationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "report_date", nullable = false, unique = true)
    private LocalDate reportDate;

    @Column(name = "total_system_assets", nullable = false, precision = 20, scale = 4)
    private BigDecimal totalSystemAssets;

    @Column(name = "total_user_liabilities", nullable = false, precision = 20, scale = 4)
    private BigDecimal totalUserLiabilities;

    @Column(nullable = false, precision = 20, scale = 4)
    private BigDecimal discrepancy;

    @Column(nullable = false, length = 20)
    private String status; // MATCHED, DISCREPANCY

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;
}
