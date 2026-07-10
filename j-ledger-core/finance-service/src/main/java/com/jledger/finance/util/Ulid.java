package com.jledger.finance.util;

import com.github.f4b6a3.ulid.UlidCreator;

/**
 * Utility wrapper for generating ULID (Universally Unique Lexicographically Sortable Identifier).
 *
 * Why we use 'com.github.f4b6a3:ulid-creator' library:
 * 1. Monotonicity Guarantee: Unlike random custom UUIDs/ULIDs, this library increments the random component
 *    by 1 when multiple IDs are generated within the exact same millisecond. This guarantees strict lexicographical
 *    and chronological ordering in high-concurrency environments.
 * 2. High Performance: The library uses bitwise operations and optimized byte buffers, which is faster and
 *    produces less garbage for the JVM Garbage Collector.
 * 3. Cryptographically Secure: It uses SecureRandom by default for generating the random component.
 * 4. Spec Conforming: It adheres 100% to the Crockford Base32 encoding specification.
 */
public class Ulid {

    private final String value;

    private Ulid(String value) {
        this.value = value;
    }

    /**
     * Generates a cryptographically secure, monotonic, and time-sortable ULID string.
     *
     * @return a new Ulid instance.
     */
    public static Ulid fast() {
        // UlidCreator.getMonotonicUlid() generates standard monotonic ULIDs
        return new Ulid(UlidCreator.getMonotonicUlid().toString());
    }

    @Override
    public String toString() {
        return this.value;
    }
}
