package com.jledger.core.service;

import com.jledger.core.domain.IntegrationOutbox;
import com.jledger.core.repository.IntegrationOutboxRepository;
import java.util.List;
import java.util.concurrent.ExecutionException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OutboxProcessor {

    private static final Logger LOGGER = LoggerFactory.getLogger(OutboxProcessor.class);
    private static final String PENDING_STATUS = "PENDING";
    private static final String PROCESSED_STATUS = "PROCESSED";

    private final IntegrationOutboxRepository integrationOutboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${jledger.outbox.topic:transaction-events}")
    private String topicName;

    @Scheduled(
            initialDelayString = "${jledger.outbox.initial-delay-ms:0}",
            fixedDelayString = "${jledger.outbox.fixed-delay-ms:2000}"
    )
    public void publishPendingEvents() {
        List<IntegrationOutbox> pendingEvents =
                integrationOutboxRepository.findTop100ByStatusOrderByCreatedAtAsc(PENDING_STATUS);

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
                LOGGER.error("Failed to publish outbox event {}", pendingEvent.getId(), exception);
            }
        }
    }
}
