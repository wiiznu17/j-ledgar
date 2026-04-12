package com.jledger.core.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.core.domain.Account;
import com.jledger.core.repository.AccountRepository;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Controller-layer integration tests for {@code POST /api/v1/transactions/transfer}.
 *
 * <p>Verifies HTTP contract: status codes, response structure, header enforcement,
 * and {@link com.jledger.core.dto.TransactionResponse} shape via MockMvc.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class TransactionControllerTest {

    // ─── Infrastructure ────────────────────────────────────────────────────────

    @Container
    static final PostgreSQLContainer<?> POSTGRESQL = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("jledger_ctrl_test")
            .withUsername("ledger_test")
            .withPassword("ledger_test");

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private LedgerEntryRepository ledgerEntryRepository;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRESQL::getUsername);
        registry.add("spring.datasource.password", POSTGRESQL::getPassword);
        registry.add("spring.flyway.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRESQL::getUsername);
        registry.add("spring.flyway.password", POSTGRESQL::getPassword);
    }

    @BeforeEach
    void cleanDatabase() {
        ledgerEntryRepository.deleteAllInBatch();
        transactionRepository.deleteAllInBatch();
        accountRepository.deleteAllInBatch();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Account createActiveAccount(String name, String balance) {
        return accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName(name)
                .balance(new BigDecimal(balance))
                .currency("THB")
                .status("ACTIVE")
                .build());
    }

    private String transferBody(UUID from, UUID to, String amount, String currency) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "fromAccountId", from.toString(),
                "toAccountId", to.toString(),
                "amount", amount,
                "currency", currency
        ));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 1: HTTP 200 — Successful Transfer
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void transfer_returns200_withTransactionResponseShape() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), receiver.getId(), "300.0000", "THB")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.transactionType", is("TRANSFER")))
                .andExpect(jsonPath("$.amount", is(300.0)))
                .andExpect(jsonPath("$.currency", is("THB")))
                .andExpect(jsonPath("$.idempotencyKey", notNullValue()))
                .andExpect(jsonPath("$.fromAccountId", is(sender.getId().toString())))
                .andExpect(jsonPath("$.toAccountId", is(receiver.getId().toString())));
    }

    @Test
    void transfer_idempotentReplay_returns200_withSameId() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");
        String idemKey = UUID.randomUUID().toString();
        String body = transferBody(sender.getId(), receiver.getId(), "100.0000", "THB");

        // First request
        String firstResponseBody = mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String firstId = objectMapper.readTree(firstResponseBody).get("id").asText();

        // Second identical request — must return same transaction ID
        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(firstId)));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 2: HTTP 400 — Missing or Invalid Header/Body
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void missingIdempotencyKeyHeader_returns400() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        // No Idempotency-Key header
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), receiver.getId(), "100.0000", "THB")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingRequestBody_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nullFromAccountId_returns400_withMessage() throws Exception {
        Account receiver = createActiveAccount("Receiver", "0.0000");

        String body = objectMapper.writeValueAsString(Map.of(
                "toAccountId", receiver.getId().toString(),
                "amount", "100.0000",
                "currency", "THB"
        ));

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("From Account ID is required")));
    }

    @Test
    void nullToAccountId_returns400_withMessage() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");

        String body = objectMapper.writeValueAsString(Map.of(
                "fromAccountId", sender.getId().toString(),
                "amount", "100.0000",
                "currency", "THB"
        ));

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("To Account ID is required")));
    }

    @Test
    void zeroAmount_returns400_withMessage() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), receiver.getId(), "0.00", "THB")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Transfer amount must be greater than zero")));
    }

    @Test
    void invalidCurrencyFormat_returns400_withMessage() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), receiver.getId(), "100.0000", "thb")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Currency must be a 3-letter uppercase code")));
    }

    @Test
    void malformedJson_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{NOT_VALID_JSON}"))
                .andExpect(status().isBadRequest());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 3: HTTP 404 — Account Not Found
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void nonExistentSenderAccount_returns404() throws Exception {
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(UUID.randomUUID(), receiver.getId(), "100.0000", "THB")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Sender account not found")));
    }

    @Test
    void nonExistentReceiverAccount_returns404() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), UUID.randomUUID(), "100.0000", "THB")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Receiver account not found")));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 4: HTTP 409 — Business Rule Conflicts
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void insufficientBalance_returns409() throws Exception {
        Account sender = createActiveAccount("Sender", "10.0000");
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), receiver.getId(), "100.0000", "THB")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Insufficient balance")));
    }

    @Test
    void frozenSenderAccount_returns409() throws Exception {
        Account sender = accountRepository.save(Account.builder()
                .userId(UUID.randomUUID())
                .accountName("Frozen Sender")
                .balance(new BigDecimal("1000.0000"))
                .currency("THB")
                .status("FROZEN")
                .build());
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), receiver.getId(), "100.0000", "THB")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Sender account is frozen")));
    }

    @Test
    void sameIdempotencyKeyWithDifferentPayload_returns409() throws Exception {
        Account sender = createActiveAccount("Sender", "1000.0000");
        Account firstReceiver = createActiveAccount("Receiver-A", "0.0000");
        Account secondReceiver = createActiveAccount("Receiver-B", "0.0000");
        String idemKey = UUID.randomUUID().toString();

        // First request
        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), firstReceiver.getId(), "100.0000", "THB")))
                .andExpect(status().isOk());

        // Second request with same key but different receiver
        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(sender.getId(), secondReceiver.getId(), "100.0000", "THB")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Idempotency-Key cannot be reused with a different transfer request")));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 5: Error Response Structure
    // ═══════════════════════════════════════════════════════════════════════════

    @Test
    void errorResponse_containsRequiredFields() throws Exception {
        Account receiver = createActiveAccount("Receiver", "0.0000");

        mockMvc.perform(post("/api/v1/transactions/transfer")
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferBody(UUID.randomUUID(), receiver.getId(), "100.0000", "THB")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.message", notNullValue()))
                .andExpect(jsonPath("$.path", notNullValue()));
    }
}
