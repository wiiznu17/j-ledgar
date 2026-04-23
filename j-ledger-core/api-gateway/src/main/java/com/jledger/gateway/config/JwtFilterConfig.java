package com.jledger.gateway.config;

import com.jledger.gateway.filters.JwtValidationFilter;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class JwtFilterConfig {

    @Bean
    public GlobalFilter jwtValidationFilter() {
        return new JwtValidationFilter() {
            @Override
            public int getOrder() {
                return Ordered.HIGHEST_PRECEDENCE; // Execute first
            }
        };
    }
}
