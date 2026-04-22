# Data Retention Policy (PDPA Thailand Compliance)

## Overview

This document defines the data retention policy for J-Ledger in compliance with Thailand's Personal Data Protection Act (PDPA) B.E. 2562 (2019).

## Data Categories and Retention Periods

### 1. User Account Data
- **Data**: User profile, registration information
- **Retention Period**: 5 years after account closure
- **Legal Basis**: Contract performance, legal obligations
- **Deletion Method**: Soft delete with anonymization

### 2. Authentication Data
- **Data**: Password hashes, PIN hashes, biometric templates
- **Retention Period**: 1 year after account closure
- **Legal Basis**: Security purposes
- **Deletion Method**: Secure deletion

### 3. Transaction Data
- **Data**: Transfer records, payment history, transaction logs
- **Retention Period**: 7 years (Bank of Thailand requirement)
- **Legal Basis**: Legal obligation, anti-money laundering
- **Deletion Method**: Archive to cold storage after 2 years

### 4. KYC/Identity Data
- **Data**: ID card images, selfie photos, address proof
- **Retention Period**: 5 years after account closure
- **Legal Basis**: Legal obligation (KYC regulations)
- **Deletion Method**: Secure deletion with certificate

### 5. Device Data
- **Data**: Device identifiers, trust levels, login history
- **Retention Period**: 2 years after last activity
- **Legal Basis**: Security purposes
- **Deletion Method**: Soft delete

### 6. Consent Records
- **Data**: Consent history, withdrawal records
- **Retention Period**: Indefinite (until data subject requests deletion)
- **Legal Basis**: Legal obligation, accountability
- **Deletion Method**: Archive

### 7. Security Logs
- **Data**: Login attempts, PIN attempts, security events
- **Retention Period**: 1 year
- **Legal Basis**: Security purposes
- **Deletion Method**: Secure deletion

### 8. Error Logs
- **Data**: Application errors, system logs
- **Retention Period**: 90 days
- **Legal Basis**: Operational purposes
- **Deletion Method**: Secure deletion

### 9. OTP Data
- **Data**: OTP challenges, verification records
- **Retention Period**: 30 days after expiration
- **Legal Basis**: Security purposes
- **Deletion Method**: Secure deletion

### 10. Notification Data
- **Data**: Push notification tokens, notification history
- **Retention Period**: 2 years after last use
- **Legal Basis**: Service delivery
- **Deletion Method**: Soft delete

## Data Minimization Principles

### Collection
- Only collect data necessary for the stated purpose
- Obtain explicit consent for each data category
- Provide clear privacy notices

### Processing
- Process only the minimum data required
- Use pseudonymization where possible
- Implement data access controls

### Storage
- Store data in secure, encrypted form
- Implement access logging
- Regular security audits

### Sharing
- Share only with explicit consent or legal requirement
- Use data processing agreements with third parties
- Track all data transfers

## Data Deletion Procedures

### Automated Deletion
- Scheduled jobs run daily to identify expired data
- Soft delete for non-sensitive data
- Secure delete for sensitive data (cryptographic erasure)

### Manual Deletion
- Data subject can request deletion via API
- Admin can initiate deletion for compliance
- Deletion requests logged and audited

### Deletion Verification
- Post-deletion verification checks
- Audit trail for all deletions
- Regular retention policy compliance audits

## Data Subject Rights

### Right to Access
- Users can view all their personal data via API
- Export functionality available
- Response within 30 days

### Right to Rectification
- Users can update their profile data
- Changes logged for audit
- Verification required for sensitive changes

### Right to Erasure (Right to be Forgotten)
- Users can request deletion of their data
- Exceptions for legal obligations
- Confirmation provided within 30 days

### Right to Portability
- Data export in machine-readable format
- Standard format (JSON, CSV)
- Transfer to other services supported

### Right to Object
- Users can object to marketing communications
- Processing continues if legally required
- Response within 30 days

## Implementation Schedule

### Phase 1: Database Schema (Current)
- Add retention periods to schema
- Add deletion timestamps
- Create deletion status tracking

### Phase 2: Automated Jobs
- Implement scheduled deletion jobs
- Add retention policy enforcement
- Create deletion monitoring

### Phase 3: API Endpoints
- Data access endpoint
- Deletion request endpoint
- Data export endpoint

### Phase 4: Monitoring & Audit
- Retention compliance dashboard
- Automated compliance reports
- Regular policy reviews

## Exceptions to Retention Policy

Data may be retained beyond standard periods if:
1. Required by law (court order, regulatory request)
2. Needed for legal proceedings
3. Required for public interest
4. Needed for historical research (anonymized)
5. Required for contract performance

## Review and Updates

This policy will be reviewed:
- Annually for compliance
- When regulations change
- After security incidents
- Based on user feedback

## Contact

For questions about this policy:
- DPO: dpo@jledger.io
- Privacy: privacy@jledger.io
- Support: support@jledger.io

## References

- PDPA Thailand B.E. 2562 (2019)
- Bank of Thailand Payment Systems Act B.E. 2560 (2017)
- Anti-Money Laundering Act B.E. 2542 (1999)
- PDPC Guidelines on Data Retention
