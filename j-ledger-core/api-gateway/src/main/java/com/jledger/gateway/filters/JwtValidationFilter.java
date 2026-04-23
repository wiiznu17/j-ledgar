package com.jledger.gateway.filters;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class JwtValidationFilter implements GatewayFilter {

    @Value("${jwt.access.secret}")
    private String jwtAccessSecret;

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtAccessSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip JWT validation for public endpoints
        if (isPublicEndpoint(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange, "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);

        try {
            JwtParserBuilder parserBuilder = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey());

            Claims claims = parserBuilder.build().parseClaimsJws(token).getBody();

            String userId = claims.getSubject();

            if (userId == null) {
                return unauthorized(exchange, "Invalid JWT: missing user ID");
            }

            // Add X-User-Id header for downstream services
            ServerWebExchange mutatedExchange = exchange.mutate()
                    .request(r -> r.header("X-User-Id", userId))
                    .build();

            return chain.filter(mutatedExchange);

        } catch (ExpiredJwtException e) {
            return unauthorized(exchange, "JWT token expired");
        } catch (UnsupportedJwtException | MalformedJwtException | IllegalArgumentException e) {
            return unauthorized(exchange, "Invalid JWT token");
        } catch (Exception e) {
            return unauthorized(exchange, "JWT validation failed");
        }
    }

    private boolean isPublicEndpoint(String path) {
        // Public endpoints that don't require JWT validation
        return path.startsWith("/api/auth/register") ||
               path.startsWith("/api/auth/login") ||
               path.startsWith("/api-docs") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/actuator/health");
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String body = String.format("{\"error\":\"%s\",\"message\":\"%s\"}", 
            HttpStatus.UNAUTHORIZED.getReasonPhrase(), message);

        DataBuffer buffer = exchange.getResponse().bufferFactory()
            .wrap(body.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
