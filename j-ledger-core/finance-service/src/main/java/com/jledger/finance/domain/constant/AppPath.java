package com.jledger.finance.domain.constant;

public enum AppPath {
    HOME("/"),
    PROFILE_SECURITY("/profile/security"),
    PROFILE_INFO("/profile/information"),
    TRANSACTION_DETAIL("/transaction");

    private final String value;

    AppPath(String value) {
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
