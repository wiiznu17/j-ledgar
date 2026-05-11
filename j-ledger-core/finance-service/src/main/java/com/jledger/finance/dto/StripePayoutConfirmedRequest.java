package com.jledger.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StripePayoutConfirmedRequest {
    private String stripePayoutId;
    private BigDecimal amount;
    private LocalDateTime arrivalDate;

    // Getters and Setters
    public String getStripePayoutId() { return stripePayoutId; }
    public void setStripePayoutId(String stripePayoutId) { this.stripePayoutId = stripePayoutId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDateTime getArrivalDate() { return arrivalDate; }
    public void setArrivalDate(LocalDateTime arrivalDate) { this.arrivalDate = arrivalDate; }
}
