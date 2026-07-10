package com.jledger.finance.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Ulid Utility Unit Tests")
class UlidTest {

    private static final String CROCKFORD_BASE32_REGEX = "^[0-9A-HJKMNP-TV-Z]{26}$";

    @Test
    @DisplayName("Should generate a valid 26-character ULID following Crockford Base32 alphabet")
    void shouldGenerateValidUlid() {
        Ulid ulid = Ulid.fast();
        String value = ulid.toString();

        assertThat(value).isNotNull();
        assertThat(value).hasSize(26);
        assertThat(value).matches(CROCKFORD_BASE32_REGEX);
    }

    @Test
    @DisplayName("Should be unique and collision-free in concurrent environments")
    void shouldBeUniqueAndCollisionFree() throws InterruptedException {
        int threadsCount = 10;
        int generationsPerThread = 1000;
        Set<String> generatedIds = ConcurrentHashMap.newKeySet();

        ExecutorService executorService = Executors.newFixedThreadPool(threadsCount);
        for (int i = 0; i < threadsCount; i++) {
            executorService.submit(() -> {
                for (int j = 0; j < generationsPerThread; j++) {
                    generatedIds.add(Ulid.fast().toString());
                }
            });
        }

        executorService.shutdown();
        boolean finished = executorService.awaitTermination(5, TimeUnit.SECONDS);

        assertThat(finished).isTrue();
        assertThat(generatedIds).hasSize(threadsCount * generationsPerThread);
    }

    @Test
    @DisplayName("Should generate sortable ids based on time sequence")
    void shouldBeLexicographicallySortableByTime() throws InterruptedException {
        Ulid first = Ulid.fast();
        Thread.sleep(5); // Wait to ensure distinct millisecond timestamp
        Ulid second = Ulid.fast();

        assertThat(first.toString()).isLessThan(second.toString());
    }
}
