package com.jledger.finance.dto;

import java.math.BigDecimal;
import java.util.List;

public class TreasurySummaryResponse {
    private BigDecimal stripeBalance;
    private BigDecimal totalBankBalance;
    private BigDecimal totalCustomerLiability;
    private BigDecimal reserveRatio;
    private List<BankAccountSummary> bankAccounts;

    public static class BankAccountSummary {
        private String name;
        private String bankName;
        private String accountNumber;
        private BigDecimal balance;
        private String provider;

        public BankAccountSummary(String name, String bankName, String accountNumber, BigDecimal balance, String provider) {
            this.name = name;
            this.bankName = bankName;
            this.accountNumber = accountNumber;
            this.balance = balance;
            this.provider = provider;
        }

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getBankName() { return bankName; }
        public void setBankName(String bankName) { this.bankName = bankName; }
        public String getAccountNumber() { return accountNumber; }
        public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
        public BigDecimal getBalance() { return balance; }
        public void setBalance(BigDecimal balance) { this.balance = balance; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
    }

    // Getters and Setters
    public BigDecimal getStripeBalance() { return stripeBalance; }
    public void setStripeBalance(BigDecimal stripeBalance) { this.stripeBalance = stripeBalance; }

    public BigDecimal getTotalBankBalance() { return totalBankBalance; }
    public void setTotalBankBalance(BigDecimal totalBankBalance) { this.totalBankBalance = totalBankBalance; }

    public BigDecimal getTotalCustomerLiability() { return totalCustomerLiability; }
    public void setTotalCustomerLiability(BigDecimal totalCustomerLiability) { this.totalCustomerLiability = totalCustomerLiability; }

    public BigDecimal getReserveRatio() { return reserveRatio; }
    public void setReserveRatio(BigDecimal reserveRatio) { this.reserveRatio = reserveRatio; }

    public List<BankAccountSummary> getBankAccounts() { return bankAccounts; }
    public void setBankAccounts(List<BankAccountSummary> bankAccounts) { this.bankAccounts = bankAccounts; }
}
