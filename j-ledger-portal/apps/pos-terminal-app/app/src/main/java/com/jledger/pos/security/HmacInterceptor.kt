package com.jledger.pos.security

import okhttp3.Interceptor
import okhttp3.Response
import java.util.UUID

/**
 * An OkHttp Interceptor that automatically injects the four mandatory cryptographic headers
 * for HMAC-SHA256 device compliance verification.
 */
class HmacInterceptor(private val secureStorage: SecureStorage) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // If the device is not provisioned yet, skip HMAC injection to allow local setups
        if (!secureStorage.isProvisioned()) {
            return chain.proceed(originalRequest)
        }

        val terminalId = secureStorage.getTerminalId() ?: ""
        val secretKey = secureStorage.getSecretKey() ?: ""

        val method = originalRequest.method
        val url = originalRequest.url
        
        // Extract the absolute path with query params (e.g. "/api/v1/terminal/payment" or "/api/merchant/deals/redemptions/code/verify")
        val path = url.encodedPath + if (url.encodedQuery != null) "?${url.encodedQuery}" else ""

        // Generate timestamp in seconds and unique UUID v4 nonce
        val timestamp = (System.currentTimeMillis() / 1000).toString()
        val nonce = UUID.randomUUID().toString()

        // Compute the HMAC-SHA256 signature in lowercase hexadecimal
        val signature = HmacSignature.calculate(method, path, timestamp, nonce, secretKey)

        // Inject the required secure headers
        val secureRequest = originalRequest.newBuilder()
            .header("X-JLedger-Terminal-Id", terminalId)
            .header("X-JLedger-Signature", signature)
            .header("X-JLedger-Timestamp", timestamp)
            .header("X-JLedger-Nonce", nonce)
            .build()

        return chain.proceed(secureRequest)
    }
}
