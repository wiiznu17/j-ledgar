package com.jledger.gateway.config;

import com.jledger.gateway.filters.JwtValidationFilter;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import reactor.core.publisher.Mono;

@Configuration
public class JwtFilterConfig {

    @Bean
    public GlobalFilter jwtValidationGlobalFilter() {
        return new GlobalFilter() {
            private final JwtValidationFilter jwtFilter = new JwtValidationFilter();

            @Override
            public Mono<Void> filter(
                    org.springframework.web.server.ServerWebExchange exchange,
                    org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {
                return jwtFilter.filter(exchange, chain);
            }
        };
    }

    @Bean
    public Ordered jwtValidationFilterOrder() {
        return new Ordered() {
            @Override
            public int getOrder() {
                return Ordered.HIGHEST_PRECEDENCE; // Execute first
            }
        };
    }
}
