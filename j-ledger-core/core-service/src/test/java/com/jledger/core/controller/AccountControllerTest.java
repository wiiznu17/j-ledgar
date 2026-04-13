package com.jledger.core.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.test.context.support.WithMockUser;
import com.jledger.core.domain.Account;
import com.jledger.core.repository.AccountRepository;
import com.jledger.core.repository.IntegrationOutboxRepository;
import com.jledger.core.repository.LedgerEntryRepository;
import com.jledger.core.repository.TransactionRepository;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
class AccountControllerTest {

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
    @Autowired private ObjectMapper objectMapper;
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

    private Account createAccount(String name, String balance, String status) {
        return accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName(name)
                .balance(new BigDecimal(balance))
                .currency("THB")
                .status(status)
                .build());
    }

    @Test
    void listAllAccounts_returnsPaginatedList() throws Exception {
        createAccount("Acc1", "100.00", "ACTIVE");
        createAccount("Acc2", "200.00", "ACTIVE");

        mockMvc.perform(get("/api/v1/accounts?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].accountName", is("Acc2"))) // sorted DESC by default
                .andExpect(jsonPath("$.content[1].accountName", is("Acc1")));
    }

    @Test
    void getAccount_existing_returnsOk() throws Exception {
        Account account = createAccount("Test", "100.00", "ACTIVE");

        mockMvc.perform(get("/api/v1/accounts/" + account.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountName", is("Test")));
    }

    @Test
    void getAccount_notFound_returns404() throws Exception {
        mockMvc.perform(get("/api/v1/accounts/" + UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateAccountStatus_valid_returnsUpdated() throws Exception {
        Account account = createAccount("Test", "100.00", "ACTIVE");

        String requestBody = objectMapper.writeValueAsString(Map.of("status", "FROZEN"));

        mockMvc.perform(put("/api/v1/accounts/" + account.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("FROZEN")));
    }

    @Test
    void updateAccountStatus_notFound_returns404() throws Exception {
        String requestBody = objectMapper.writeValueAsString(Map.of("status", "FROZEN"));

        mockMvc.perform(put("/api/v1/accounts/" + UUID.randomUUID() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound());
    }
}
