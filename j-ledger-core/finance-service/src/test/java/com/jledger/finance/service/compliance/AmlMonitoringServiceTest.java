package com.jledger.finance.service.compliance;

import com.jledger.finance.service.compliance.impl.AmlMonitoringServiceImpl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.domain.entity.SuspiciousActivity;
import com.jledger.finance.domain.enums.SuspiciousActivityStatus;
import com.jledger.finance.domain.enums.SuspiciousActivityType;
import com.jledger.finance.repository.compliance.SuspiciousActivityRepository;
import com.jledger.finance.repository.transaction.TransactionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AmlMonitoringService Unit Tests")
class AmlMonitoringServiceTest {

    @Mock
    private SuspiciousActivityRepository suspiciousActivityRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AmlMonitoringServiceImpl amlMonitoringService;

    private static final Long WALLET_ID = 6006L;
    private static final Long TO_WALLET_ID = 6007L;
    private static final UUID TRANSFER_ID = UUID.randomUUID();
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID ACTIVITY_ID = UUID.randomUUID();

    @Nested
    @DisplayName("checkTransactionForSuspiciousActivity Method Tests")
    class CheckTransactionTests {

        @Test
        @DisplayName("Should detect and save LARGE_TRANSACTION activity if transfer exceeds 100,000 THB")
        void shouldFlagLargeTransaction() throws JsonProcessingException {
            // Arrange
            BigDecimal largeAmount = new BigDecimal("150000.00");
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");

            // Mock other rules to keep them clean
            when(transactionRepository.countByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(0L);
            when(transactionRepository.findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(Collections.emptyList());

            // Act
            amlMonitoringService.checkTransactionForSuspiciousActivity(
                    WALLET_ID, largeAmount, TRANSFER_ID, TO_WALLET_ID
            );

            // Assert
            verify(suspiciousActivityRepository).save(argThat(activity ->
                    activity.getActivityType() == SuspiciousActivityType.LARGE_TRANSACTION &&
                    activity.getAmount().equals(largeAmount) &&
                    activity.getRiskScore() == 60 &&
                    activity.getStatus() == SuspiciousActivityStatus.FLAGGED
            ));
        }

        @Test
        @DisplayName("Should detect and save HIGH_FREQUENCY activity if client makes > 10 transactions in one hour")
        void shouldFlagHighFrequencyTransaction() throws JsonProcessingException {
            // Arrange
            BigDecimal normalAmount = new BigDecimal("500.00");
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");

            // Setup frequency violation
            when(transactionRepository.countByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(15L); // 15 transactions > 10 threshold
            when(transactionRepository.findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(Collections.emptyList());

            // Act
            amlMonitoringService.checkTransactionForSuspiciousActivity(
                    WALLET_ID, normalAmount, TRANSFER_ID, TO_WALLET_ID
            );

            // Assert
            verify(suspiciousActivityRepository).save(argThat(activity ->
                    activity.getActivityType() == SuspiciousActivityType.HIGH_FREQUENCY &&
                    activity.getRiskScore() == 70 &&
                    activity.getDescription().contains("15 transactions")
            ));
        }

        @Test
        @DisplayName("Should detect and save ROUND_NUMBER activity if transfer is a large round value (>= 50,000 THB multiple of 10,000)")
        void shouldFlagLargeRoundNumbers() throws JsonProcessingException {
            // Arrange
            BigDecimal roundAmount = new BigDecimal("80000.00");
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");

            when(transactionRepository.countByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(0L);
            when(transactionRepository.findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(Collections.emptyList());

            // Act
            amlMonitoringService.checkTransactionForSuspiciousActivity(
                    WALLET_ID, roundAmount, TRANSFER_ID, TO_WALLET_ID
            );

            // Assert
            verify(suspiciousActivityRepository).save(argThat(activity ->
                    activity.getActivityType() == SuspiciousActivityType.ROUND_NUMBER &&
                    activity.getRiskScore() == 40 &&
                    activity.getAmount().equals(roundAmount)
            ));
        }

        @Test
        @DisplayName("Should detect and save MULTIPLE_RECIPIENTS activity if transfer goes to > 5 unique accounts in one day")
        void shouldFlagMultipleRecipients() throws JsonProcessingException {
            // Arrange
            BigDecimal normalAmount = new BigDecimal("2000.00");
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");

            when(transactionRepository.countByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(0L);
            
            // 6 distinct target wallets > 5 threshold
            List<Long> targets = List.of(101L, 102L, 103L, 104L, 105L, 106L);
            when(transactionRepository.findDistinctToWalletIdByFromWalletIdAndCreatedAtAfter(eq(WALLET_ID), any()))
                    .thenReturn(targets);

            // Act
            amlMonitoringService.checkTransactionForSuspiciousActivity(
                    WALLET_ID, normalAmount, TRANSFER_ID, TO_WALLET_ID
            );

            // Assert
            verify(suspiciousActivityRepository).save(argThat(activity ->
                    activity.getActivityType() == SuspiciousActivityType.MULTIPLE_RECIPIENTS &&
                    activity.getRiskScore() == 50 &&
                    activity.getDescription().contains("6 different recipients")
            ));
        }
    }

    @Nested
    @DisplayName("reportSuspiciousActivityToAmlo Method Tests")
    class ReportToAmloTests {

        @Test
        @DisplayName("Should successfully submit activity to AMLO, transition status, and generate reference code")
        void shouldReportToAmloSuccessfully() {
            // Arrange
            SuspiciousActivity activity = SuspiciousActivity.builder()
                    .id(ACTIVITY_ID)
                    .userId(USER_ID)
                    .status(SuspiciousActivityStatus.FLAGGED)
                    .build();

            when(suspiciousActivityRepository.findById(ACTIVITY_ID)).thenReturn(Optional.of(activity));
            when(suspiciousActivityRepository.save(activity)).thenReturn(activity);

            // Act
            String amloRef = amlMonitoringService.reportSuspiciousActivityToAmlo(ACTIVITY_ID, "INVESTIGATOR_ALICE");

            // Assert
            assertThat(amloRef).isNotNull().startsWith("STR-");
            assertThat(activity.getStatus()).isEqualTo(SuspiciousActivityStatus.REPORTED_TO_AMLO);
            assertThat(activity.getReviewedBy()).isEqualTo("INVESTIGATOR_ALICE");
            assertThat(activity.getReportedToAmloAt()).isBeforeOrEqualTo(LocalDateTime.now());
            
            verify(suspiciousActivityRepository).save(activity);
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException if reported suspicious activity is not found")
        void shouldThrowExceptionWhenActivityNotFound() {
            // Arrange
            when(suspiciousActivityRepository.findById(ACTIVITY_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> amlMonitoringService.reportSuspiciousActivityToAmlo(ACTIVITY_ID, "ALICE"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Suspicious activity not found");

            verify(suspiciousActivityRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("updateSuspiciousActivityStatus Method Tests")
    class UpdateStatusTests {

        @Test
        @DisplayName("Should successfully update status and append reviewer descriptions")
        void shouldUpdateActivityStatus() {
            // Arrange
            SuspiciousActivity activity = SuspiciousActivity.builder()
                    .id(ACTIVITY_ID)
                    .description("Initial suspicious alert")
                    .status(SuspiciousActivityStatus.FLAGGED)
                    .build();

            when(suspiciousActivityRepository.findById(ACTIVITY_ID)).thenReturn(Optional.of(activity));

            // Act
            amlMonitoringService.updateSuspiciousActivityStatus(
                    ACTIVITY_ID, 
                    SuspiciousActivityStatus.CONFIRMED_LEGITIMATE, 
                    "BOB", 
                    "Legitimate salary payout"
            );

            // Assert
            assertThat(activity.getStatus()).isEqualTo(SuspiciousActivityStatus.CONFIRMED_LEGITIMATE);
            assertThat(activity.getReviewedBy()).isEqualTo("BOB");
            assertThat(activity.getDescription()).isEqualTo("Initial suspicious alert | Review: Legitimate salary payout");
            
            verify(suspiciousActivityRepository).save(activity);
        }
    }

    @Nested
    @DisplayName("recordSuspiciousActivity Method Tests")
    class RecordTakeoverActivityTests {

        @Test
        @DisplayName("Should successfully record custom suspicious activities with risk score 50 (e.g. ACCOUNT_TAKEOVER)")
        void shouldRecordAccountTakeoverActivity() throws JsonProcessingException {
            // Arrange
            when(objectMapper.writeValueAsString(any())).thenReturn("{}");

            // Act
            amlMonitoringService.recordSuspiciousActivity(
                    USER_ID,
                    "RAPID_ACCOUNT_CHANGES",
                    "Sim swap suspected",
                    TRANSFER_ID
            );

            // Assert
            verify(suspiciousActivityRepository).save(argThat(activity ->
                    activity.getUserId().equals(USER_ID) &&
                    activity.getActivityType() == SuspiciousActivityType.RAPID_ACCOUNT_CHANGES &&
                    activity.getStatus() == SuspiciousActivityStatus.FLAGGED &&
                    activity.getRiskScore() == 50 &&
                    activity.getDescription().equals("Sim swap suspected")
            ));
        }
    }

    @Nested
    @DisplayName("Query Method Tests")
    class QueryTests {

        @Test
        @DisplayName("Should fetch all suspicious activities for a user ordered by date")
        void shouldGetActivitiesForUser() {
            // Arrange
            List<SuspiciousActivity> list = Collections.singletonList(new SuspiciousActivity());
            when(suspiciousActivityRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(list);

            // Act
            List<SuspiciousActivity> result = amlMonitoringService.getSuspiciousActivities(USER_ID);

            // Assert
            assertThat(result).hasSize(1);
            verify(suspiciousActivityRepository).findByUserIdOrderByCreatedAtDesc(USER_ID);
        }

        @Test
        @DisplayName("Should fetch paginated list of all suspicious activities")
        void shouldGetAllActivities() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<SuspiciousActivity> page = new PageImpl<>(Collections.singletonList(new SuspiciousActivity()));
            when(suspiciousActivityRepository.findAll(pageable)).thenReturn(page);

            // Act
            Page<SuspiciousActivity> result = amlMonitoringService.getAllSuspiciousActivities(pageable);

            // Assert
            assertThat(result).hasSize(1);
            verify(suspiciousActivityRepository).findAll(pageable);
        }
    }
}
