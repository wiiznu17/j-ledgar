package com.jledger.finance.service.system;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogService Unit Tests")
class AuditLogServiceTest {

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AuditLogService auditLogService;

    private static final UUID ACCOUNT_ID = UUID.randomUUID();
    private static final UUID TARGET_ID = UUID.randomUUID();
    private static final UUID TRANSACTION_ID = UUID.randomUUID();

    @Nested
    @DisplayName("Audit Logging Operation Tests")
    class AuditLoggingOperationTests {

        @Test
        @DisplayName("Should successfully serialize transfer audit map and log it")
        void shouldSuccessfullyLogTransfer() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"TRANSFER\"}");

            // Act
            auditLogService.logTransferOperation(
                    TRANSACTION_ID,
                    ACCOUNT_ID,
                    TARGET_ID,
                    new BigDecimal("1000.00"),
                    "THB",
                    "SUCCESS",
                    "ADMIN"
            );

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should gracefully handle exceptions and not throw if serialization fails during transfer audit logging")
        void shouldGracefullyHandleTransferSerializationFailure() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenThrow(new RuntimeException("Jackson error"));

            // Act & Assert (Should not throw exception)
            auditLogService.logTransferOperation(
                    TRANSACTION_ID,
                    ACCOUNT_ID,
                    TARGET_ID,
                    new BigDecimal("1000.00"),
                    "THB",
                    "SUCCESS",
                    "ADMIN"
            );

            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log account freeze operation")
        void shouldSuccessfullyLogAccountFreeze() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"ACCOUNT_FREEZE\"}");

            // Act
            auditLogService.logAccountFreeze(ACCOUNT_ID, "Compliance Failure", "AML_SYSTEM");

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log account unfreeze operation")
        void shouldSuccessfullyLogAccountUnfreeze() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"ACCOUNT_UNFREEZE\"}");

            // Act
            auditLogService.logAccountUnfreeze(ACCOUNT_ID, "Resolved", "ADMIN");

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log limit updates")
        void shouldSuccessfullyLogLimitUpdate() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"LIMIT_UPDATE\"}");

            // Act
            auditLogService.logTransactionLimitUpdate(
                    ACCOUNT_ID,
                    "DAILY",
                    new BigDecimal("50000.00"),
                    new BigDecimal("100000.00"),
                    "ADMIN"
            );

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log KYC status changes")
        void shouldSuccessfullyLogKycChange() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"KYC\"}");

            // Act
            auditLogService.logKycStatusChange(ACCOUNT_ID, "PENDING", "APPROVED", "COMPLIANCE_OFFICER");

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log AMLO reports")
        void shouldSuccessfullyLogAmloReport() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"AMLO\"}");

            // Act
            auditLogService.logAmloReport(UUID.randomUUID(), "AMLO-REF-1234", "SYSTEM");

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log failed transactions")
        void shouldSuccessfullyLogFailedTransaction() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"FAILED\"}");

            // Act
            auditLogService.logFailedTransaction(TRANSACTION_ID, ACCOUNT_ID, TARGET_ID, new BigDecimal("100.00"), "Insufficient Funds");

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log rate limit violations")
        void shouldSuccessfullyLogRateLimitViolation() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"RATELIMIT\"}");

            // Act
            auditLogService.logRateLimitViolation(ACCOUNT_ID, "BURST", "15 requests/sec");

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }

        @Test
        @DisplayName("Should successfully serialize and log data retention cleanups")
        void shouldSuccessfullyLogDataRetention() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(anyMap())).thenReturn("{\"operation\":\"RETENTION\"}");

            // Act
            auditLogService.logDataRetentionCleanup("TRANSACTION_CLEANUP", 250, 100, "SYSTEM_CRON");

            // Assert
            verify(objectMapper).writeValueAsString(anyMap());
        }
    }
}
