package com.jledger.finance.service.compliance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jledger.finance.domain.entity.Wallet;
import com.jledger.finance.repository.wallet.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AmlEventConsumer {

    private final AmlMonitoringService amlMonitoringService;
    private final FraudPatternDetectionService fraudPatternDetectionService;
    private final WalletRepository walletRepository;
    private final ObjectMapper objectMapper;

    @org.springframework.kafka.annotation.RetryableTopic(
        attempts = "3",
        backoff = @org.springframework.retry.annotation.Backoff(delay = 2000, multiplier = 2.0),
        topicSuffixingStrategy = org.springframework.kafka.retrytopic.TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE,
        exclude = {com.fasterxml.jackson.core.JsonProcessingException.class}
    )
    @KafkaListener(topics = "${jledger.outbox.topic:financial-events-v1}", groupId = "finance-aml-group")
    public void consumeFinancialEvent(String message) {
        try {
            JsonNode event;
            try {
                event = objectMapper.readTree(message);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                log.error("📢 [AML Consumer] Malformed JSON payload received: {}", message, e);
                return;
            }
            if (event == null) return;

            // Extract core transaction details
            String userIdStr = event.has("userId") ? event.get("userId").asText() : null;
            String eventType = event.has("eventType") ? event.get("eventType").asText() : null;
            String statusStr = event.has("status") ? event.get("status").asText() : null;
            String amountStr = event.has("amount") ? event.get("amount").asText() : null;
            String referenceIdStr = event.has("referenceId") ? event.get("referenceId").asText() : null;

            if (userIdStr == null || amountStr == null) {
                log.warn("📢 [AML Consumer] Missing crucial event data: userId={}, amount={}", userIdStr, amountStr);
                return;
            }

            // Only inspect COMPLETED or successful transaction records to prevent false flags on failures
            if (statusStr != null && !"COMPLETED".equalsIgnoreCase(statusStr) && !"SUCCESS".equalsIgnoreCase(statusStr)) {
                return;
            }

            JsonNode metadata = event.has("metadata") ? event.get("metadata") : null;
            boolean isReceiver = false;
            String recipientUserIdStr = null;

            if (metadata != null) {
                isReceiver = metadata.has("isReceiver") && metadata.get("isReceiver").asBoolean();
                if (metadata.has("recipientUserId")) {
                    recipientUserIdStr = metadata.get("recipientUserId").asText();
                }
            }

            // Execute check only from sender's perspective to avoid duplicate scans
            if (isReceiver) {
                return;
            }

            log.info("📢 [AML Consumer] Intercepted outbound transaction for user: {}. Amount: {}. Type: {}",
                    userIdStr, amountStr, eventType);

            BigDecimal amount = new BigDecimal(amountStr);

            // 1. Resolve sender wallet ID
            Wallet senderWallet = walletRepository.findByUserId(userIdStr).orElse(null);
            if (senderWallet == null) {
                log.warn("📢 [AML Consumer] Wallet not found for user: {}", userIdStr);
                return;
            }
            Long senderWalletId = senderWallet.getId();

            // 2. Resolve recipient wallet ID if applicable
            Long recipientWalletId = null;
            if (recipientUserIdStr != null) {
                Wallet recipientWallet = walletRepository.findByUserId(recipientUserIdStr).orElse(null);
                if (recipientWallet != null) {
                    recipientWalletId = recipientWallet.getId();
                }
            }

            // 3. Resolve transfer UUID
            UUID transferUuid;
            try {
                transferUuid = referenceIdStr != null ? UUID.fromString(referenceIdStr) : UUID.randomUUID();
            } catch (IllegalArgumentException e) {
                transferUuid = UUID.randomUUID();
            }

            // 4. Trigger AML rules scan
            amlMonitoringService.checkTransactionForSuspiciousActivity(
                    senderWalletId,
                    amount,
                    transferUuid,
                    recipientWalletId
                );

            // 5. Trigger multi-transaction fraud pattern scans (structuring, layering, integration, cash-out)
            fraudPatternDetectionService.detectAllPatterns(senderWalletId);

        } catch (Exception e) {
            log.error("❌ [AML Consumer] Error processing event payload: {}", message, e);
            throw new RuntimeException("Error processing AML event", e);
        }
    }

    @org.springframework.kafka.annotation.DltHandler
    public void handleDlt(String message, @org.springframework.messaging.handler.annotation.Header(org.springframework.kafka.support.KafkaHeaders.RECEIVED_TOPIC) String topic) {
        log.error("❌ [AML Consumer DLT] Event moved to DLT topic {}: {}", topic, message);
    }
}
