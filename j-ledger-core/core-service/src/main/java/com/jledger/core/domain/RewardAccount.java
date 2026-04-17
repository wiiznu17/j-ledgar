package com.jledger.core.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reward_accounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardAccount {

    @Id
    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "points_balance", nullable = false)
    private BigDecimal pointsBalance;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
