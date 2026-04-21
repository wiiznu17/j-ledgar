# KYC Compliance - Bank of Thailand Regulations

## Overview

This document outlines KYC (Know Your Customer) compliance requirements for J-Ledger in accordance with Bank of Thailand regulations.

## Regulatory Requirements

### 1. Customer Identification Program (CIP)

**Required Information:**
- Full name (as per ID card)
- Thai National ID number (13 digits)
- Date of birth
- Address (current and permanent)
- Occupation and source of income
- Contact information (phone, email)
- Photograph (ID card and selfie)

**Verification Methods:**
- Government ID database verification
- OCR verification of ID card
- Liveness detection for selfie
- Address proof verification

### 2. Risk-Based Approach

**Low Risk:**
- Thai citizens with valid ID
- Standard income range
- No political exposure
- No adverse media

**Medium Risk:**
- Foreign nationals
- High-income individuals
- Large transaction volumes
- Cross-border transactions

**High Risk:**
- Politically Exposed Persons (PEPs)
- Sanctioned individuals/entities
- High-risk jurisdictions
- Complex ownership structures

### 3. Enhanced Due Diligence (EDD)

**For High-Risk Customers:**
- Additional identity verification
- Source of funds documentation
- Senior management approval
- Ongoing monitoring (monthly)
- Transaction limits

### 4. Ongoing Monitoring

**Frequency:**
- Low risk: Every 3 years
- Medium risk: Every 2 years
- High risk: Every year

**Triggers for Re-KYC:**
- Change in address or occupation
- Significant increase in transaction volume
- Suspicious activity
- Regulatory requirement changes

### 5. PEP Screening

**Screening Requirements:**
- Domestic PEP list (Thai government officials)
- International PEP lists (FATF, EU, US)
- Sanctions lists (OFAC, UN, EU)
- Adverse media screening

**Family Members:**
- Spouse
- Children
- Parents
- Siblings

### 6. Transaction Monitoring

**Reportable Transactions:**
- Cash transactions > 50,000 THB
- Cross-border transactions
- Suspicious transactions (any amount)
- Structured transactions (smurfing)

**Red Flags:**
- Frequent large transactions
- Transactions with no apparent business purpose
- Transactions with high-risk jurisdictions
- Inconsistent transaction patterns

## Implementation Status

### Completed
- ✅ ID card OCR verification
- ✅ Liveness detection for selfie
- ✅ Basic KYC data collection
- ✅ KYC verification status tracking

### Pending
- ⏳ Government ID database integration
- ⏳ PEP screening integration
- ⏳ Sanctions list screening
- ⏳ Enhanced due diligence logic
- ⏳ Periodic KYC review automation
- ⏳ Transaction monitoring rules
- ⏳ Suspicious activity reporting

## Integration Requirements

### Government ID Database
- Department of Provincial Administration (DOPA) API
- Real-time ID verification
- Name and ID number matching
- Address verification

### PEP Screening Services
- World-Check
- Dow Jones
- LexisNexis
- Thai government PEP list

### Sanctions Screening
- OFAC SDN List
- UN Sanctions List
- EU Sanctions List
- Thai Sanctions List

## Data Retention

**KYC Documents:**
- ID card images: 5 years after account closure
- Selfie photos: 5 years after account closure
- Address proof: 5 years after account closure
- Source of funds documents: 7 years

**KYC Records:**
- Verification logs: 7 years
- Risk assessment: 7 years
- EDD documentation: 7 years
- PEP screening results: 7 years

## Audit Trail

All KYC-related activities must be logged:
- Data collection
- Verification attempts
- Risk assessments
- Approvals/rejections
- Ongoing monitoring results

## References

- Bank of Thailand Notification on Customer Due Diligence (2017)
- FATF Recommendations on KYC
- PDPA Thailand Guidelines on Special Categories of Personal Data
- Anti-Money Laundering Act B.E. 2542 (1999)
