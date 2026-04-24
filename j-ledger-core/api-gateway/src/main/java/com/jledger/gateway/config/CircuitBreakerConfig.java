package com.jledger.gateway.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CircuitBreakerConfiguration {

    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        CircuitBreakerConfig transferConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(50) // Open circuit if 50% of calls fail
                .waitDurationInOpenState(Duration.ofSeconds(30)) // Wait 30s before trying again
                .slidingWindowSize(10) // Consider last 10 calls
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .minimumNumberOfCalls(5) // Need at least 5 calls before calculating failure rate
                .permittedNumberOfCallsInHalfOpenState(3) // Allow 3 calls in half-open state
                .slowCallRateThreshold(50) // Open if 50% of calls are slow
                .slowCallDurationThreshold(Duration.ofSeconds(5)) // Consider calls > 5s as slow
                .build();

        CircuitBreakerConfig coreServiceConfig = CircuitBreakerConfig.custom()
                .failureRateThreshold(60) // More lenient for general core-service
                .waitDurationInOpenState(Duration.ofSeconds(20))
                .slidingWindowSize(20)
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .minimumNumberOfCalls(10)
                .permittedNumberOfCallsInHalfOpenState(5)
                .slowCallRateThreshold(60)
                .slowCallDurationThreshold(Duration.ofSeconds(3))
                .build();

        CircuitBreakerRegistry registry = CircuitBreakerRegistry.builder()
                .addCircuitBreakerConfig("coreTransferCircuitBreaker", transferConfig)
                .addCircuitBreakerConfig("coreServiceCircuitBreaker", coreServiceConfig)
                .build();

        return registry;
    }
}
