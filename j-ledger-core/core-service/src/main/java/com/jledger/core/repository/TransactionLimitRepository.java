package com.jledger.core.repository;

import com.jledger.core.domain.TransactionLimit;
import com.jledger.core.domain.TransactionLimitType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TransactionLimitRepository extends JpaRepository<TransactionLimit, UUID> {

    List<TransactionLimit> findByAccountId(UUID accountId);

    Optional<TransactionLimit> findByAccountIdAndLimitType(UUID accountId, TransactionLimitType limitType);

    @Query("SELECT tl FROM TransactionLimit tl WHERE tl.accountId = :accountId AND tl.isActive = true")
    List<TransactionLimit> findActiveLimitsByAccountId(@Param("accountId") UUID accountId);
}
