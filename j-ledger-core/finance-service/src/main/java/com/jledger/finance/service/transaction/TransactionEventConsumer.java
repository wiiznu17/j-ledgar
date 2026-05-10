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

    @KafkaListener(topics = "${jledger.outbox.topic:financial-events-v1}", groupId = "finance-analytics-group")
    public void consumeTransactionEvent(String message) {
        try {
            JsonNode event = objectMapper.readTree(message);
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
        }
    }
}
