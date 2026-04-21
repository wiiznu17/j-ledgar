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
            @Value("${jledger.redis.password:}") String redisPassword,
            @Value("${jledger.redis.connection-pool-size:20}") int connectionPoolSize,
            @Value("${jledger.redis.connection-minimum-idle-size:5}") int connectionMinimumIdleSize,
            @Value("${jledger.redis.connect-timeout:5000}") int connectTimeout,
            @Value("${jledger.redis.timeout:5000}") int timeout
    ) {
        Config config = new Config();
        SingleServerConfig singleServerConfig = config.useSingleServer()
                .setAddress(redisAddress)
                // Connection settings
                .setConnectTimeout(connectTimeout)      // ms — fail fast on connection
                .setTimeout(timeout)                      // ms — max wait for Redis response
                .setRetryAttempts(3)                      // retry on transient errors
                .setRetryInterval(1500)                  // ms — delay between retries
                .setConnectionPoolSize(connectionPoolSize) // max connections per pod
                .setConnectionMinimumIdleSize(connectionMinimumIdleSize)
                .setIdleConnectionTimeout(10000)         // ms — close idle connections
                // Performance optimizations
                .setKeepAlive(true)                       // enable keep-alive
                .setPingConnectionInterval(30000)         // ms — ping interval
                .setSubscriptionConnectionPoolSize(5)     // for pub/sub
                // Lock settings
                .setLockWatchdogTimeout(30000)           // ms — watchdog timeout
                .setNettyThreads(32)                      // netty threads for I/O
                .setThreads(64);                          // total threads

        if (redisPassword != null && !redisPassword.isBlank()) {
            singleServerConfig.setPassword(redisPassword);
        }

        return Redisson.create(config);
    }
}
