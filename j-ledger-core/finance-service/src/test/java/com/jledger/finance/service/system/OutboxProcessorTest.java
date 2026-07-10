package com.jledger.finance.service.system;

import com.jledger.finance.repository.system.IntegrationOutboxRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OutboxProcessor Unit Tests")
class OutboxProcessorTest {

    @Mock
    private IntegrationOutboxRepository repository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    private OutboxProcessor outboxProcessor;

    @BeforeEach
    void setUp() {
        outboxProcessor = new OutboxProcessor(repository, kafkaTemplate);
        ReflectionTestUtils.setField(outboxProcessor, "retentionDays", 30);
    }

    @Test
    @DisplayName("Should successfully delete processed events older than 30 days")
    void shouldCleanupProcessedEvents() {
        // Arrange
        ZonedDateTime expectedCutoff = ZonedDateTime.now().minusDays(30);
        when(repository.deleteByStatusAndCreatedAtBefore(eq("PROCESSED"), any(ZonedDateTime.class)))
                .thenReturn(5);

        // Act
        outboxProcessor.cleanupProcessedEvents();

        // Assert
        ArgumentCaptor<ZonedDateTime> cutoffCaptor = ArgumentCaptor.forClass(ZonedDateTime.class);
        verify(repository).deleteByStatusAndCreatedAtBefore(eq("PROCESSED"), cutoffCaptor.capture());
        
        // Assert cutoff is within 1 second of expected cutoff
        assertThat(cutoffCaptor.getValue()).isCloseTo(expectedCutoff, within(1, ChronoUnit.SECONDS));
    }
}
