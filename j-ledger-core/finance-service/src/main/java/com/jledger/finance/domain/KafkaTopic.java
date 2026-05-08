package com.jledger.finance.domain;

public enum KafkaTopic {
    SECURITY_EVENTS("security-events"),
    KYC_EVENTS("kyc-events"),
    FINANCE_EVENTS("finance-events"),
    FINANCIAL_EVENTS_V1("financial-events-v1"),
    TRANSACTION_EVENTS("transaction-events"),
    NOTIFICATION_EVENTS("notification-events");

    private final String value;

    KafkaTopic(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
