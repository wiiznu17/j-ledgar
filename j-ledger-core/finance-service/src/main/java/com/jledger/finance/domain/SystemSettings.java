package com.jledger.finance.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // System Settings
    @Column(nullable = false)
    private String systemName = "J-Ledger";

    @Column
    private String companyName = "J-Ledger Co., Ltd.";

    @Column
    private String supportEmail = "support@jledger.com";

    @Column
    private String supportPhone = "+66-2-123-4567";

    @Column(nullable = false)
    private String defaultCurrency = "THB";

    @Column
    private String businessHoursStart = "09:00";

    @Column
    private String businessHoursEnd = "17:00";

    @Column(nullable = false)
    private Boolean emailNotificationsEnabled = true;

    @Column(nullable = false)
    private Boolean smsNotificationsEnabled = true;

    @Column(nullable = false)
    private Boolean kycRequired = true;

    @Column(nullable = false)
    private Boolean twoFactorAuthRequired = false;

    @Column(nullable = false)
    private String defaultLanguage = "th";

    @Column(nullable = false)
    private String timezone = "Asia/Bangkok";

    @Column(nullable = false)
    private Integer sessionTimeoutMinutes = 30;

    @Column(nullable = false)
    private String registrationMode = "open"; // open or closed

    // Fee Configuration
    @Column(nullable = false)
    @Builder.Default
    private BigDecimal transferFeeFixed = BigDecimal.valueOf(5);

    @Column(nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal transferFeePercentage = BigDecimal.valueOf(0.01);

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal topUpFeeFixed = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal topUpFeePercentage = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal billPaymentFeeFixed = BigDecimal.valueOf(10);

    @Column(nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal billPaymentFeePercentage = BigDecimal.valueOf(0.005);

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal withdrawalFeeFixed = BigDecimal.valueOf(25);

    @Column(nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal withdrawalFeePercentage = BigDecimal.valueOf(0.02);

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal minimumFee = BigDecimal.ONE;

    // Limit Configuration
    @Column(nullable = false)
    @Builder.Default
    private BigDecimal dailyTransactionLimit = BigDecimal.valueOf(500000);

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal monthlyTransactionLimit = BigDecimal.valueOf(5000000);

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal perTransactionLimit = BigDecimal.valueOf(100000);

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal walletBalanceLimit = BigDecimal.valueOf(1000000);

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal dailyTopUpLimit = BigDecimal.valueOf(200000);

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
