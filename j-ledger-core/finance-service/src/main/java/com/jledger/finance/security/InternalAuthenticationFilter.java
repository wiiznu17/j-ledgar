package com.jledger.finance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;

@Component
public class InternalAuthenticationFilter extends OncePerRequestFilter {

    @Value("${jledger.internal.secret}")
    private String internalSecret;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String secretHeader = request.getHeader("X-Internal-Secret");
        final String signatureHeader = request.getHeader("X-JLedger-Signature");
        final String timestampHeader = request.getHeader("X-JLedger-Timestamp");
        final String nonceHeader = request.getHeader("X-JLedger-Nonce");
        final String bodyHashHeader = request.getHeader("X-JLedger-Body-SHA256");

        boolean isAuthenticated = false;

        // 1. Legacy Shared Secret Auth
        if (secretHeader != null && MessageDigest.isEqual(
                secretHeader.getBytes(StandardCharsets.UTF_8),
                internalSecret.getBytes(StandardCharsets.UTF_8))) {
            isAuthenticated = true;
        } 
        // 2. Foundation HMAC Auth (Phase A: Preparation)
        else if (signatureHeader != null && timestampHeader != null && nonceHeader != null) {
            isAuthenticated = validateHmacSignature(request, signatureHeader, timestampHeader, nonceHeader, bodyHashHeader);
        }

        if (isAuthenticated) {
            // Internal system request - grant full internal authority
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    "INTERNAL_SYSTEM",
                    null,
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_INTERNAL"))
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }

    private boolean validateHmacSignature(
            HttpServletRequest request,
            String signature,
            String timestamp,
            String nonce,
            String bodyHash
    ) {
        try {
            long ts = Long.parseLong(timestamp);
            long now = System.currentTimeMillis() / 1000L;
            
            // Anti-replay: 5 minutes tolerance
            if (Math.abs(now - ts) > 300) {
                return false;
            }

            // Canonical request: METHOD:URI:QUERY:TIMESTAMP:NONCE:BODY_SHA256
            // For requests without a body hash header, we sign with an empty segment.
            String queryString = request.getQueryString() == null ? "" : request.getQueryString();
            String normalizedBodyHash = bodyHash == null ? "" : bodyHash.trim();
            String dataToSign = String.join(":",
                    request.getMethod(),
                    request.getRequestURI(),
                    queryString,
                    timestamp,
                    nonce,
                    normalizedBodyHash
            );
            return verifyHmac(dataToSign, signature);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean verifyHmac(String data, String expectedSignature) throws Exception {
        javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
                internalSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(secretKey);
        byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hmacBytes) {
            sb.append(String.format("%02x", b));
        }
        String computed = sb.toString();
        if (computed.length() != expectedSignature.length()) {
            return false;
        }
        return MessageDigest.isEqual(computed.getBytes(StandardCharsets.UTF_8),
                expectedSignature.getBytes(StandardCharsets.UTF_8));
    }
}
