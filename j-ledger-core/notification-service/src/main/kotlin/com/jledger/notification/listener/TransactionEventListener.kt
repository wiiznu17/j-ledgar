package com.jledger.notification.listener

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

@Component
class TransactionEventListener(private val objectMapper: ObjectMapper) {

    private val logger = LoggerFactory.getLogger(TransactionEventListener::class.java)

    @KafkaListener(topics = ["\${jledger.outbox.topic:transaction-events}"], groupId = "notification-group")
    fun listen(message: String) {
        try {
            val jsonNode: JsonNode = objectMapper.readTree(message)
            // Example of extracting id or transactionId from the payload. Adjust to actual schema.
            val id = jsonNode.get("id")?.asText() ?: jsonNode.get("transactionId")?.asText() ?: "UNKNOWN"
            
            logger.info("Simulating SMS notification to user for transaction: [$id]")
        } catch (e: Exception) {
            logger.error("Failed to parse transaction event: \$message", e)
        }
    }
}
