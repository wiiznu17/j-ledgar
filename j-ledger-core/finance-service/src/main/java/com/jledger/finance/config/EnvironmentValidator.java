package com.jledger.finance.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Component
public class EnvironmentValidator {

  @Autowired
  private Environment environment;

  private static final String[] REQUIRED_ENV_VARS = {
    "JLEDGER_DATASOURCE_URL",
    "JLEDGER_DATASOURCE_USERNAME",
    "JLEDGER_DATASOURCE_PASSWORD",
    "SPRING_REDIS_PASSWORD",
    "JLEDGER_INTERNAL_SECRET",
  };

  @PostConstruct
  public void validateEnvironment() {
    for (String var : REQUIRED_ENV_VARS) {
      String value = environment.getProperty(var);
      if (value == null || value.trim().isEmpty()) {
        throw new IllegalStateException(
          String.format("Required environment variable not set: %s", var)
        );
      }
      // E.g. we might enforce minimum lengths for passwords/secrets
      if (var.contains("PASSWORD") || var.contains("SECRET")) {
        if (value.length() < 8) {
          throw new IllegalStateException(
            String.format("Environment variable %s is too short (minimum 8 characters)", var)
          );
        }
      }
    }
  }
}
