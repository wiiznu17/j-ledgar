package com.jledger.gateway;

import com.github.tomakehurst.wiremock.client.WireMock;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.web.reactive.server.WebTestClient;

import static com.github.tomakehurst.wiremock.client.WireMock.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWireMock(port = 0)
public class GatewayIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @AfterEach
    public void tearDown() {
        WireMock.reset();
    }

    @Test
    public void testRoutingToCoreService() {
        // Stub downstream service for routing verification
        stubFor(get(urlEqualTo("/api/v1/transactions/test"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"message\":\"success\"}")));

        webTestClient.get()
                .uri("/api/v1/transactions/test")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.message").isEqualTo("success");
    }

    @Test
    public void testSecurityHeadersPropagation() {
        // Stub downstream service to assert headers explicitly
        stubFor(post(urlEqualTo("/api/v1/transactions"))
                .withHeader("Idempotency-Key", equalTo("req-uuid-1234"))
                .willReturn(aResponse()
                        .withStatus(201)
                        .withBody("{\"status\":\"created\"}")));

        webTestClient.post()
                .uri("/api/v1/transactions")
                .header("Idempotency-Key", "req-uuid-1234")
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.status").isEqualTo("created");
    }

    @Test
    public void testCircuitBreakerFallbackOn500Error() {
        // Simulating core service throwing an explicit exception
        stubFor(get(urlEqualTo("/api/v1/transactions/fail"))
                .willReturn(aResponse()
                        .withStatus(500)));

        webTestClient.get()
                .uri("/api/v1/transactions/fail")
                .exchange()
                .expectStatus().is5xxServerError() // Corresponds to HttpStatus.SERVICE_UNAVAILABLE from our FallbackController
                .expectBody()
                .jsonPath("$.status").isEqualTo("DOWNSTREAM_ERROR")
                .jsonPath("$.message").isEqualTo("Core service is currently unavailable. Please try again later.");
    }
}
