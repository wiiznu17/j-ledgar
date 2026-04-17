package com.jledger.core.controller;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.security.test.context.support.WithMockUser;

import com.jledger.core.domain.Account;
import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.domain.LedgerEntry;
import com.jledger.core.domain.Transaction;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = {
    "jledger.outbox.initial-delay-ms=600000",
    "jledger.outbox.fixed-delay-ms=600000",
    "eureka.client.enabled=false"
})
@AutoConfigureMockMvc(addFilters = false)
@Testcontainers
@WithMockUser(roles = "SUPER_ADMIN")
class SystemControllerTest {

    @Container
    @SuppressWarnings("resource")
    static final PostgreSQLContainer<?> POSTGRESQL = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("jledger_plus_ctrl_test")
            .withUsername("ledger_test")
            .withPassword("ledger_test");

    @Container
    @SuppressWarnings("resource")
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);

    @Autowired private MockMvc mockMvc;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private LedgerEntryRepository ledgerEntryRepository;
    @Autowired private IntegrationOutboxRepository integrationOutboxRepository;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRESQL::getUsername);
        registry.add("spring.datasource.password", POSTGRESQL::getPassword);
        registry.add("spring.flyway.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRESQL::getUsername);
        registry.add("spring.flyway.password", POSTGRESQL::getPassword);
        registry.add("jledger.redis.address",
                () -> "redis://" + REDIS.getHost() + ":" + REDIS.getMappedPort(6379));
        registry.add("jledger.redis.password", () -> "");
    }

    @BeforeEach
    void cleanDatabase() {
        integrationOutboxRepository.deleteAllInBatch();
        ledgerEntryRepository.deleteAllInBatch();
        transactionRepository.deleteAllInBatch();
        accountRepository.deleteAllInBatch();
    }

    @Test
    void reconcile_calculatesCorrectSums() throws Exception {
        Account userA = accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName("User A")
                .balance(new BigDecimal("150.0000"))
                .currency("THB")
                .status("ACTIVE")
                .build());
        
        Account userB = accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName("User B")
                .balance(new BigDecimal("50.0000"))
                .currency("THB")
                .status("ACTIVE")
                .build());

        Transaction tx = transactionRepository.save(Transaction.builder()
                .idempotencyKey(UUID.randomUUID().toString())
                .fromAccountId(userA.getId())
                .toAccountId(userB.getId())
                .transactionType("TRANSFER")
                .amount(new BigDecimal("50.0000"))
                .currency("THB")
                .status("SUCCESS")
                .build());

        ledgerEntryRepository.save(LedgerEntry.builder()
                .transaction(tx)
                .account(userA)
                .entryType("DEBIT")
                .amount(new BigDecimal("50.0000"))
                .build());
                
        ledgerEntryRepository.save(LedgerEntry.builder()
                .transaction(tx)
                .account(userB)
                .entryType("CREDIT")
                .amount(new BigDecimal("50.0000"))
                .build());

        mockMvc.perform(post("/api/v1/system/reconcile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAccountBalances", is(200.0)))
                .andExpect(jsonPath("$.totalCredits", is(50.0)))
                .andExpect(jsonPath("$.totalDebits", is(50.0)));
    }
}
