# PCI-DSS Compliance Audit Report

**Date:** April 22, 2026
**Scope:** wallet-api (Authentication Service)
**PCI-DSS Version:** 4.0

## Executive Summary

**Compliance Status:** **COMPLIANT** (with recommendations)

wallet-api does not store, process, or transmit payment card data. The service only handles authentication, KYC, and user management. Payment processing is handled by separate payment providers with their own PCI-DSS compliance.

## PCI-DSS Requirements Assessment

### Requirement 3: Protect Stored Cardholder Data

**Status:** ✅ NOT APPLICABLE

**Findings:**
- No payment card data (PAN, CVV, expiry date) stored in wallet-api
- Only stores Thai National ID card data for KYC purposes (encrypted)
- ID card number is encrypted at rest (`idCardNumberEncrypted`)
- ID card tokenization implemented (`idCardToken`)

**Evidence:**
- Schema review: No card data fields in database
- KycData model: Only `idCardNumberEncrypted` and `idCardToken` present
- No card-related DTOs in payment module

**Recommendations:**
- ✅ Maintain current practice of not storing card data
- ✅ Continue using tokenization for ID card data
- ✅ Regular audit of any new payment integrations

### Requirement 4: Encrypt Transmission of Cardholder Data

**Status:** ✅ NOT APPLICABLE

**Findings:**
- No card data transmitted by wallet-api
- All API communications use HTTPS/TLS
- Certificate pinning baseline implemented in mobile app
- Certificate validation in axios interceptor

**Evidence:**
- `apps/wallet-app/src/lib/certificate-validation.ts` - HTTPS enforcement
- `apps/wallet-app/src/lib/axios.ts` - Certificate validation
- `apps/wallet-app/CERTIFICATE_PINNING.md` - Pinning documentation

**Recommendations:**
- ✅ Ensure TLS 1.2+ for all communications
- ✅ Monitor certificate expiration
- ⚠️ Consider full certificate pinning for production (currently baseline only)

### Requirement 6: Develop and Maintain Secure Systems and Applications

**Status:** ✅ COMPLIANT

**Findings:**
- Strong password policies implemented (uppercase, lowercase, special characters, min length)
- PIN validation with lockout mechanism
- Device trust management
- Session management with JWT
- Rate limiting implemented
- Security event logging

**Evidence:**
- `apps/wallet-api/src/auth/dto/auth.dto.ts` - Password validation
- `apps/wallet-api/src/auth/auth.service.ts` - PIN lockout
- `apps/wallet-api/src/app.module.ts` - Rate limiting configuration
- Security logs stored in `SecurityLog` model

**Recommendations:**
- ✅ Continue strong password policies
- ⚠️ Implement regular security testing
- ⚠️ Add dependency vulnerability scanning

### Requirement 7: Restrict Access to Cardholder Data

**Status:** ✅ NOT APPLICABLE

**Findings:**
- No card data to restrict access to
- Role-based access control for user data
- Authentication required for all endpoints
- Device trust verification for sensitive operations

**Evidence:**
- `JwtAuthGuard` on all protected endpoints
- `TransactionPinGuard` for financial operations
- Device trust level checks

**Recommendations:**
- ✅ Maintain current access controls
- ⚠️ Regular review of user access rights

### Requirement 8: Identify and Authenticate Access to System Components

**Status:** ✅ COMPLIANT

**Findings:**
- Multi-factor authentication (password + PIN + biometric)
- Device-based authentication
- Session management with token rotation
- Secure session storage

**Evidence:**
- Biometric authentication implementation
- Device trust management
- JWT with access/refresh tokens
- Secure storage in mobile app

**Recommendations:**
- ✅ Continue MFA implementation
- ⚠️ Consider adding hardware token support for admin accounts

### Requirement 10: Track and Monitor All Access to Network Resources and Cardholder Data

**Status:** ✅ COMPLIANT

**Findings:**
- Security event logging implemented
- Audit trail for all authentication events
- Device tracking
- Failed login attempts logging
- PIN attempt logging

**Evidence:**
- `SecurityLog` model with comprehensive event tracking
- `PinAttempt` model for PIN verification attempts
- `UserDevice` model for device tracking

**Recommendations:**
- ✅ Maintain current logging
- ⚠️ Implement log analysis and alerting
- ⚠️ Regular log review process

### Requirement 12: Maintain a Policy that Addresses Information Security

**Status:** ✅ COMPLIANT

**Findings:**
- Data retention policy documented (`DATA_RETENTION_POLICY.md`)
- KYC compliance policy documented (`KYC_COMPLIANCE.md`)
- AML compliance policy documented (`AML_COMPLIANCE.md`)
- PDPA consent management implemented

**Evidence:**
- Comprehensive policy documentation
- Consent tracking for PDPA compliance
- Data subject rights implementation

**Recommendations:**
- ✅ Maintain current policies
- ⚠️ Regular policy review and updates
- ⚠️ Security awareness training for team

## Payment Card Data Flow

**Current Architecture:**
```
Mobile App → wallet-api (Auth) → Payment Gateway (PCI-DSS Compliant)
                          ↓
                      No Card Data
```

**Payment Processing:**
- Top-up via PromptPay (no card data)
- Top-up via Credit Card (handled by payment provider)
- wallet-api only receives payment confirmation
- No card data ever enters wallet-api

## Recommendations Summary

### High Priority
1. ✅ Continue not storing card data
2. ⚠️ Implement full certificate pinning for production
3. ⚠️ Add dependency vulnerability scanning (Snyk, Dependabot)

### Medium Priority
4. ⚠️ Implement log analysis and alerting
5. ⚠️ Regular security testing (SAST, DAST)
6. ⚠️ Security awareness training

### Low Priority
7. ⚠️ Hardware token support for admin accounts
8. ⚠️ Automated compliance monitoring

## Conclusion

wallet-api is **COMPLIANT** with PCI-DSS requirements as it does not store, process, or transmit payment card data. All card data handling is delegated to PCI-DSS compliant payment providers.

The service maintains strong security practices for authentication and user data management, which aligns with PCI-DSS security principles.

**Overall Risk Level:** LOW
**Compliance Level:** COMPLIANT
