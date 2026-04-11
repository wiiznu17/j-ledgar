package com.jledger.core.repository;

import com.jledger.core.domain.IntegrationOutbox;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IntegrationOutboxRepository extends JpaRepository<IntegrationOutbox, UUID> {

    List<IntegrationOutbox> findTop100ByStatusOrderByCreatedAtAsc(String status);
}
