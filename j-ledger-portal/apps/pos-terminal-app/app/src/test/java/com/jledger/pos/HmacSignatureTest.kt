package com.jledger.pos

import com.jledger.pos.security.HmacSignature
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

/**
 * Unit Tests validating the cryptographic integrity and determinism of HmacSignature.
 */
class HmacSignatureTest {

    @Test
    fun testHmacSignatureCalculation() {
        val method = "POST"
        val path = "/api/v1/terminal/payment"
        val timestamp = "1716912000"
        val nonce = "550e8400-e29b-41d4-a716-446655440000"
        val secretKey = "super_secret_hmac_key"

        // Calculate first signature
        val sig1 = HmacSignature.calculate(method, path, timestamp, nonce, secretKey)
        
        // Calculate second signature with identical inputs
        val sig2 = HmacSignature.calculate(method, path, timestamp, nonce, secretKey)
        
        // 1. Assert Determinism: Identical inputs must yield identical hash output
        assertEquals("HMAC signature must be deterministic", sig1, sig2)
        
        // 2. Assert length: SHA-256 output in hex must be exactly 64 characters long
        assertEquals("HMAC signature must be 64 characters (hex)", 64, sig1.length)
        
        // 3. Assert hex format: must consist only of lowercase hex characters
        val hexRegex = Regex("^[0-9a-f]{64}$")
        assertEquals("HMAC signature must match hex regex pattern", true, hexRegex.matches(sig1))

        // 4. Assert key change changes signature
        val sigDifferentKey = HmacSignature.calculate(method, path, timestamp, nonce, "different_secret_key")
        assertNotEquals("Signature must change when secret key changes", sig1, sigDifferentKey)

        // 5. Assert nonce change changes signature
        val sigDifferentNonce = HmacSignature.calculate(method, path, timestamp, "different-nonce-1234", secretKey)
        assertNotEquals("Signature must change when nonce changes", sig1, sigDifferentNonce)

        // 6. Assert method case normalization (should normalize to uppercase or match case)
        val sigLowercaseMethod = HmacSignature.calculate("post", path, timestamp, nonce, secretKey)
        assertEquals("Signature calculation must normalize HTTP method to uppercase", sig1, sigLowercaseMethod)
    }
}
