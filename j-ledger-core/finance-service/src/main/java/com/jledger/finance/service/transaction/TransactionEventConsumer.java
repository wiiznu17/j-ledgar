package com.jledger.finance.service.transaction;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class TransactionEventConsumer {
    private static final Logger LOGGER = LoggerFactory.getLogger(TransactionEventConsumer.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.kafka.annotation.RetryableTopic(
        attempts = "3",
        backoff = @org.springframework.retry.annotation.Backoff(delay = 2000, multiplier = 2.0),
        topicSuffixingStrategy = org.springframework.kafka.retrytopic.TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
        exclude = {com.fasterxml.jackson.core.JsonProcessingException.class}
    )
    @KafkaListener(topics = "${jledger.outbox.topic:financial-events-v1}", groupId = "finance-analytics-group")
    public void consumeTransactionEvent(String message) {
        try {
            JsonNode event;
            try {
                event = objectMapper.readTree(message);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                LOGGER.error("📢 [Kafka Consumer] Malformed JSON payload received: {}", message, e);
                return;
            }
            if (event == null) return;

            String type = event.get("eventType").asText();
            BigDecimal amount = new BigDecimal(event.get("amount").asText());
            String userId = event.get("userId").asText();

            LOGGER.info("📢 [Kafka Consumer] Received {} event: User {} moved ฿{}", type, userId, amount);

            // Business Logic Example: High Value Alert
            if (amount.compareTo(new BigDecimal("10000")) > 0) {
                LOGGER.warn("⚠️ [HIGH VALUE] User {} just processed a large transaction: ฿{}", userId, amount);
            }

        } catch (Exception e) {
            LOGGER.error("❌ [Kafka Consumer] Failed to process message: {}", message, e);
            throw new RuntimeException("Error processing transaction event", e);
        }
    }

    @org.springframework.kafka.annotation.DltHandler
    public void handleDlt(String message, @org.springframework.messaging.handler.annotation.Header(org.springframework.kafka.support.KafkaHeaders.RECEIVED_TOPIC) String topic) {
        LOGGER.error("❌ [Kafka Consumer DLT] Event moved to DLT topic {}: {}", topic, message);
    }
}
