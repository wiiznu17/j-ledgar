package com.jledger.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record MerchantMultiPayRequest(
    @NotBlank(message = "fromWalletId is required")
    String fromWalletId,

    @NotBlank(message = "currency is required")
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be a 3-letter uppercase code")
    String currency,

    @NotEmpty(message = "legs cannot be empty")
    @Valid
    List<MerchantPayLeg> legs
) {}
