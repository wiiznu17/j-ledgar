package com.jledger.finance.dto;

import com.jledger.finance.domain.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

public record AccountCreateRequest(
    @NotNull(message = "user_id is required")
    UUID user_id,

    @NotBlank(message = "account_name is required")
    String account_name,

    @NotBlank(message = "currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be a 3-letter uppercase code")
    String currency,

    AccountType account_type
) {}
