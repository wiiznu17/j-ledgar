package com.jledger.finance.domain;

public enum NotificationEventType {
    // Onboarding
    REGISTER_INIT_OTP,
    REGISTER_OTP_VERIFIED,
    KYC_SUBMITTED,
    REGISTRATION_COMPLETED,
    
    // KYC Status
    KYC_APPROVED,
    KYC_REJECTED,

    // Security
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    PASSWORD_CHANGE,
    PASSWORD_SET,
    PIN_SETUP,
    LOGOUT,
    LOGOUT_ALL,

    // Finance
    TOPUP,
    TRANSFER,
    WITHDRAW,
    PAYMENT,
    REFUND,
    BILL_PAYMENT,
    FINANCE
}
