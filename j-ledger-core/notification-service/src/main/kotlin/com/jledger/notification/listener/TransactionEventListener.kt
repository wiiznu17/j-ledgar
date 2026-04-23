package com.jledger.notification.listener

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.jledger.notification.model.NotificationType
import com.jledger.notification.service.NotificationService
import org.slf4j.LoggerFactory
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

import java.text.DecimalFormat

@Component
class TransactionEventListener(
    private val objectMapper: ObjectMapper,
    private val notificationService: NotificationService
) {

    private val logger = LoggerFactory.getLogger(TransactionEventListener::class.java)
    private val decimalFormat = DecimalFormat("#,##0.00")

    @KafkaListener(topics = ["\${jledger.outbox.topic:wallet.transaction.events}"], groupId = "notification-group")
    fun listen(message: String) {
        try {
            val jsonNode: JsonNode = objectMapper.readTree(message)
            val type = jsonNode.get("type")?.asText() ?: "UNKNOWN"
            val accountId = jsonNode.get("accountId")?.asText() ?: "UNKNOWN"
            val amount = jsonNode.get("amount")?.asDouble() ?: 0.0
            val currency = jsonNode.get("currency")?.asText() ?: "THB"

            val currencyText = if (currency == "THB") "บาท" else currency
            val formattedAmount = decimalFormat.format(amount)

            val (title, notificationMessage) = when (type) {
                "CREDIT" -> Pair("เงินเข้า", "คุณได้รับเงิน $formattedAmount $currencyText")
                "DEBIT" -> Pair("เงินออก", "คุณโอนเงิน $formattedAmount $currencyText")
                else -> Pair("Transaction updated", "Transaction updated: $formattedAmount $currencyText")
            }

            // Save notification to database (using accountId as userId for now)
            notificationService.createNotification(
                userId = accountId,
                type = NotificationType.TRANSACTION,
                title = title,
                message = notificationMessage
            )

            logger.info("[NOTIFICATION SAVED] User Account: $accountId -> Message: $notificationMessage")
        } catch (e: Exception) {
            logger.error("Failed to parse transaction event: $message", e)
        }
    }
}
