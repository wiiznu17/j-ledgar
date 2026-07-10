package com.jledger.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StripePayoutConfirmedRequest {
    @NotBlank(message = "stripePayoutId is required")
    private String stripePayoutId;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "arrivalDate is required")
    private LocalDateTime arrivalDate;

    // Getters and Setters
    public String getStripePayoutId() { return stripePayoutId; }
    public void setStripePayoutId(String stripePayoutId) { this.stripePayoutId = stripePayoutId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getArrivalDate() { return arrivalDate; }
    public void setArrivalDate(LocalDateTime arrivalDate) { this.arrivalDate = arrivalDate; }
}
