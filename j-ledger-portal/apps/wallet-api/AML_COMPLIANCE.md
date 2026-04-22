# AML Transaction Monitoring - Anti-Money Laundering Compliance

## Overview

This document outlines AML (Anti-Money Laundering) transaction monitoring requirements for J-Ledger in accordance with Thai AML regulations.

## Regulatory Requirements

### 1. Reportable Transactions

**Cash Transactions:**
- Single cash transaction > 50,000 THB
- Multiple cash transactions totaling > 50,000 THB within 24 hours
- Structured transactions (smurfing) - splitting large amounts

**Cross-Border Transactions:**
- All cross-border transfers
- Incoming/outgoing international transfers
- Any amount to/from high-risk jurisdictions

**Suspicious Transactions:**
- Transactions with no apparent business purpose
- Inconsistent transaction patterns
- Transactions involving high-risk individuals
- Rapid movement of funds (layering)

### 2. High-Risk Jurisdictions

**Primary Concerns:**
- Countries with weak AML/CFT regimes
- Countries under international sanctions
- Tax havens
- Countries with high corruption indices

**Examples:**
- North Korea, Iran, Syria (sanctioned)
- Certain Caribbean jurisdictions
- Unregulated crypto exchanges

### 3. Red Flags

**Transaction Patterns:**
- Frequent large transactions just below reporting threshold
- Round number transactions (e.g., 100,000 THB)
- Immediate withdrawal after deposit
- Multiple small transfers to different recipients
- Transactions at unusual times (2-4 AM)

**Behavioral Indicators:**
- Reluctance to provide KYC information
- Use of multiple accounts
- Requests to bypass normal procedures
- Unexplained source of wealth

**Geographic Indicators:**
- Transactions to/from high-risk jurisdictions
- Multiple IP addresses from different countries
- Use of VPN/proxy services

### 4. Monitoring Frequency

**Real-Time Monitoring:**
- All transactions > 10,000 THB
- Cross-border transactions
- Transactions to high-risk recipients

**Daily Review:**
- Aggregate transaction volume per user
- Pattern analysis for smurfing
- Velocity checks

**Weekly Review:**
- High-risk user activity
- Suspicious pattern trends
- Compliance with reporting requirements

### 5. Reporting Requirements

**STR (Suspicious Transaction Report):**
- Submit to AMLO (Anti-Money Laundering Office)
- Within 3 business days of detection
- Include all relevant details
- Maintain records for 5 years

**CTR (Cash Transaction Report):**
- Cash transactions > 50,000 THB
- Submit within 15 days
- Include customer identification
- Maintain records for 5 years

**Cross-Border Report:**
- All cross-border transfers
- Submit within 15 days
- Include sender/receiver details
- Maintain records for 5 years

## Implementation Status

### Completed
- ✅ Basic transaction tracking
- ✅ Transfer model with status tracking

### Pending
- ⏳ Suspicious transaction detection rules
- ⏳ Automated STR/CTR generation
- ⏳ High-risk jurisdiction list
- ⏳ Pattern analysis (smurfing detection)
- ⏳ Velocity checks
- ⏳ AMLO integration for reporting
- ⏳ 5-year record retention

## Detection Rules

### Rule 1: Large Transaction Alert
- Amount > 100,000 THB
- Flag for manual review

### Rule 2: High-Frequency Alert
- > 10 transactions in 1 hour
- Flag for potential smurfing

### Rule 3: Round Number Alert
- Amount is round number (e.g., 50,000, 100,000)
- Flag for structuring

### Rule 4: Rapid Movement Alert
- Deposit followed by withdrawal within 5 minutes
- Flag for layering

### Rule 5: High-Risk Jurisdiction Alert
- Transfer to/from high-risk country
- Flag for STR

### Rule 6: Multiple Recipients Alert
- > 5 different recipients in 1 day
- Flag for distribution network

## Integration Requirements

### AMLO Reporting
- AMLO API integration
- Digital STR submission
- Acknowledgment tracking
- Status updates

### Internal Monitoring
- Dashboard for compliance team
- Alert notifications
- Case management system
- Audit trail

## Data Retention

**AML Records:**
- STR/CTR reports: 5 years
- Transaction records: 7 years
- Monitoring logs: 5 years
- Customer risk assessments: 7 years
- Investigation records: 7 years

## References

- Anti-Money Laundering Act B.E. 2542 (1999)
- AMLO Notification on Transaction Reporting
- FATF Recommendations on AML/CFT
- Bank of Thailand AML Guidelines
