package com.jledger.finance.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseSchemaValidationConfig {

    @Bean
    public ApplicationRunner validateFinanceSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            String relation = jdbcTemplate.queryForObject(
                    "SELECT to_regclass('finance.transactions')",
                    String.class
            );

            if (relation == null || relation.isBlank()) {
                throw new IllegalStateException(
                        "Missing required table finance.transactions. " +
                        "Run finance migrations before starting finance-service."
                );
            }
        };
    }
}
