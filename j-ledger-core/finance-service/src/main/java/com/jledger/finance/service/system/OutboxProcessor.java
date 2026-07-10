package com.jledger.finance.service.system;

import com.jledger.finance.domain.constant.KafkaTopic;
import com.jledger.finance.domain.entity.IntegrationOutbox;
import com.jledger.finance.repository.system.IntegrationOutboxRepository;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.concurrent.ExecutionException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OutboxProcessor {

    private static final Logger LOGGER = LoggerFactory.getLogger(OutboxProcessor.class);
    private static final String PENDING_STATUS = "PENDING";
    private static final String PROCESSED_STATUS = "PROCESSED";
    private static final String DEAD_LETTER_STATUS = "DEAD_LETTER";

    private final IntegrationOutboxRepository integrationOutboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${jledger.outbox.topic:financial-events-v1}")
    private String topicName;

    @Value("${jledger.outbox.max-retries:5}")
    private int maxRetries;

    @Value("${jledger.outbox.cleanup.retention-days:30}")
    private int retentionDays;

    /**
     * Publishes PENDING outbox events to Kafka.
     *
     * <p>The {@code @Transactional} annotation ensures that the repository query runs inside a
     * transaction, enabling {@code SELECT ... FOR UPDATE SKIP LOCKED} behaviour at the DB level
     * (when paired with a locking repository query) so that concurrent poller instances in a
     * multi-pod deployment cannot claim the same batch of events.
     */
    @Transactional
    @Scheduled(
            initialDelayString = "${jledger.outbox.initial-delay-ms:0}",
            fixedDelayString = "${jledger.outbox.fixed-delay-ms:2000}"
    )
    public void publishPendingEvents() {
        List<IntegrationOutbox> pendingEvents =
                integrationOutboxRepository.findAndLockPendingEvents(PENDING_STATUS);

        for (IntegrationOutbox pendingEvent : pendingEvents) {
            try {
                kafkaTemplate.send(
                        topicName,
                        pendingEvent.getId().toString(),
                        pendingEvent.getPayload().toString()
                ).get();

                pendingEvent.setStatus(PROCESSED_STATUS);
                integrationOutboxRepository.save(pendingEvent);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                LOGGER.warn("Outbox processing interrupted while publishing event {}", pendingEvent.getId(), exception);
                return;
            } catch (ExecutionException exception) {
                int newRetryCount = pendingEvent.getRetryCount() + 1;
                pendingEvent.setRetryCount(newRetryCount);
                pendingEvent.setLastError(exception.getCause() != null
                        ? exception.getCause().getMessage()
                        : exception.getMessage());

                if (newRetryCount >= maxRetries) {
                    pendingEvent.setStatus(DEAD_LETTER_STATUS);
                    LOGGER.error("Outbox event {} moved to DEAD_LETTER after {} retries",
                            pendingEvent.getId(), newRetryCount, exception);
                } else {
                    LOGGER.warn("Failed to publish outbox event {} (attempt {}/{})",
                            pendingEvent.getId(), newRetryCount, maxRetries, exception);
                }
                integrationOutboxRepository.save(pendingEvent);
            }
        }
    }

    /**
     * Periodically cleans up PROCESSED outbox events older than the configured retention days.
     */
    @Transactional
    @Scheduled(cron = "${jledger.outbox.cleanup-cron:0 0 2 * * ?}")
    public void cleanupProcessedEvents() {
        ZonedDateTime cutoffTime = ZonedDateTime.now().minusDays(retentionDays);
        LOGGER.info("Starting outbox cleanup for events older than {} (retention period: {} days)", cutoffTime, retentionDays);
        int deletedCount = integrationOutboxRepository.deleteByStatusAndCreatedAtBefore(PROCESSED_STATUS, cutoffTime);
        LOGGER.info("Successfully deleted {} processed outbox events", deletedCount);
    }
}
