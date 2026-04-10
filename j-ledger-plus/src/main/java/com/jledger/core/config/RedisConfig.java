package com.jledger.core.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.redisson.config.SingleServerConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RedisConfig {

    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient(
            @Value("${jledger.redis.address:redis://localhost:6379}") String redisAddress,
            @Value("${jledger.redis.password:}") String redisPassword
    ) {
        Config config = new Config();
        SingleServerConfig singleServerConfig = config.useSingleServer()
                .setAddress(redisAddress)
                .setConnectTimeout(2000)   // ms — fail fast on connection
                .setTimeout(3000)          // ms — max wait for Redis response
                .setRetryAttempts(2)       // retry on transient errors
                .setConnectionPoolSize(10) // max connections per pod
                .setConnectionMinimumIdleSize(2);

        if (redisPassword != null && !redisPassword.isBlank()) {
            singleServerConfig.setPassword(redisPassword);
        }

        return Redisson.create(config);
    }
}
