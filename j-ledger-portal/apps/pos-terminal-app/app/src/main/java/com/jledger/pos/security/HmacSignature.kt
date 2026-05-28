package com.jledger.pos.security

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * Utility object for generating HMAC-SHA256 hexadecimal signatures.
 * Used to prove transaction authenticity and verify device compliance in real-time.
 */
object HmacSignature {

    /**
     * Calculates the HMAC-SHA256 signature for a specific request.
     * Payload format matches the backend formula exactly: "${METHOD}:${path}:${timestamp}:${nonce}"
     */
    fun calculate(
        method: String,
        path: String,
        timestamp: String,
        nonce: String,
        secretKey: String
    ): String {
        val payload = "${method.uppercase()}:$path:$timestamp:$nonce"
        return calculateHmacSha256(payload, secretKey)
    }

    /**
     * Generates a raw HMAC-SHA256 hash and encodes it to a lowercase hexadecimal string.
     */
    private fun calculateHmacSha256(data: String, key: String): String {
        val algorithm = "HmacSHA256"
        val secretKeySpec = SecretKeySpec(key.toByteArray(Charsets.UTF_8), algorithm)
        val mac = Mac.getInstance(algorithm)
        mac.init(secretKeySpec)
        val hashBytes = mac.doFinal(data.toByteArray(Charsets.UTF_8))
        return bytesToHex(hashBytes)
    }

    /**
     * Converts a ByteArray to a hexadecimal string representation efficiently.
     */
    private fun bytesToHex(bytes: ByteArray): String {
        val hexChars = CharArray(bytes.size * 2)
        for (i in bytes.indices) {
            val v = bytes[i].toInt() and 0xFF
            hexChars[i * 2] = HEX_ARRAY[v ushr 4]
            hexChars[i * 2 + 1] = HEX_ARRAY[v and 0x0F]
        }
        return String(hexChars)
    }

    private val HEX_ARRAY = "0123456789abcdef".toCharArray()
}
