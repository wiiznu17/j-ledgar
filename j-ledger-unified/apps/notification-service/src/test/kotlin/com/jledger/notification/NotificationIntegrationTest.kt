package com.jledger.notification

import org.assertj.core.api.Assertions.assertThat
import org.awaitility.Awaitility.await
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.system.CapturedOutput
import org.springframework.boot.test.system.OutputCaptureExtension
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.kafka.test.context.EmbeddedKafka
import org.springframework.test.annotation.DirtiesContext
import java.util.concurrent.TimeUnit

@SpringBootTest(properties = [
    "spring.kafka.consumer.auto-offset-reset=earliest",
    "spring.kafka.bootstrap-servers=\${spring.embedded.kafka.brokers}",
    "eureka.client.enabled=false"
])
@EmbeddedKafka(partitions = 1, brokerProperties = ["listeners=PLAINTEXT://localhost:0", "port=0"])
@DirtiesContext
@ExtendWith(OutputCaptureExtension::class)
class NotificationIntegrationTest {

    @Autowired
    lateinit var kafkaTemplate: KafkaTemplate<String, String>

    @Test
    fun `should consume valid JSON event and log simulation mapping correctly`(output: CapturedOutput) {
        // Arrange
        val topic = "transaction-events"
        val payload = """
            {
                "id": "txn-abc-12345",
                "status": "COMPLETED",
                "amount": "500.00"
            }
        """.trimIndent()

        // Act
        kafkaTemplate.send(topic, payload)

        // Assert
        await().atMost(10, TimeUnit.SECONDS).untilAsserted {
            assertThat(output.out).contains("Simulating SMS notification to user for transaction: [txn-abc-12345]")
        }
    }

    @Test
    fun `should handle poison pill gracefully and log explicit error`(output: CapturedOutput) {
        // Arrange
        val topic = "transaction-events"
        val poisonPill = "{ malformed_json_payload: null }"

        // Act
        kafkaTemplate.send(topic, poisonPill)

        // Assert
        await().atMost(10, TimeUnit.SECONDS).untilAsserted {
            assertThat(output.toString()).contains("Failed to parse transaction event")
        }
    }
}
