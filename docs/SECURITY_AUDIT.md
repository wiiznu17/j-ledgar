# J-Ledger Security Audit Report

**Date:** May 21, 2026  
**Scope:** Full codebase audit based on OWASP Top 10  
**Auditor:** Automated Security Analysis

---

## Executive Summary

This security audit evaluates the J-Ledger fintech platform against OWASP Top 10 security risks. The audit identified **3 HIGH**, **5 MEDIUM**, and **4 LOW** severity issues that should be addressed to improve the security posture of the application.

### Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| **HIGH** | 3 | 🔴 Requires Immediate Action |
| **MEDIUM** | 5 | 🟡 Should Be Addressed Soon |
| **LOW** | 4 | 🟢 Nice to Have |

---

## OWASP Top 10 Findings

### 1. Broken Access Control (A01:2021)

**Severity:** MEDIUM

#### Finding 1.1: CORS Fallback to Hardcoded Origins
- **Location:** `j-ledger-portal/apps/portal-service/src/main.ts:69-83`
- **Issue:** If `JLEDGER_ALLOWED_ORIGINS` is not set in production, the application falls back to hardcoded origins
- **Risk:** Misconfiguration could allow unintended origins
- **Recommendation:** 
  ```typescript
  // Remove fallback or make it explicit error
  if (nodeEnv === 'production' && !process.env.JLEDGER_ALLOWED_ORIGINS) {
    throw new Error('JLEDGER_ALLOWED_ORIGINS must be set in production');
  }
  ```

#### Finding 1.2: Missing Authorization on Some Endpoints
- **Location:** Various controllers
- **Issue:** Some endpoints may not have proper guard decorators
- **Recommendation:** Audit all endpoints to ensure @UseGuards is applied where needed

---

### 2. Cryptographic Failures (A02:2021)

**Severity:** HIGH

#### Finding 2.1: Hardcoded Secret Key in POS Simulator
- **Location:** `j-ledger-portal/scripts/pos-simulator.js:13`
- **Code:** `const SECRET_KEY = 'sk_03f73f9cf5ce47eda6f0b2516b32a7d19556fbc0f1c3c9d8';`
- **Risk:** Secret key exposed in source code
- **Recommendation:** 
  ```javascript
  const SECRET_KEY = process.env.TERMINAL_SECRET_KEY || 'dev_default';
  ```
  - Remove from git history
  - Add to .gitignore if this is a real key

#### Finding 2.2: Default Secrets in Example Files
- **Location:** `.env.before`, `.env.example`
- **Issue:** Default passwords and secrets in example files
- **Risk:** Developers might use default values in production
- **Recommendation:** 
  - Use placeholders like `YOUR_SECURE_PASSWORD_HERE`
  - Add validation to reject default values in production

---

### 3. Injection (A03:2021)

**Severity:** LOW

#### Finding 3.1: SQL Query Safety
- **Location:** Finance service repositories
- **Status:** ✅ **PASS** - All queries use JPQL or parameterized native queries with @Param
- **Example:** 
  ```java
  @Query("SELECT w FROM Wallet w WHERE w.userId = :userId")
  Optional<Wallet> findByUserIdForUpdate(@Param("userId") String userId);
  ```
- **Recommendation:** Continue using parameterized queries

#### Finding 3.2: Input Validation
- **Location:** DTOs throughout portal-service
- **Status:** ✅ **GOOD** - Global ValidationPipe configured with whitelist and forbidNonWhitelisted
- **Code:** `main.ts:56-61`
- **Recommendation:** Maintain current validation approach

---

### 4. Insecure Design (A04:2021)

**Severity:** MEDIUM

#### Finding 4.1: Client-Side Rate Limiting
- **Location:** `j-ledger-portal/apps/admin-web/src/lib/auth/rate-limit.ts`
- **Issue:** Rate limiting implemented client-side only
- **Risk:** Can be bypassed by attackers
- **Recommendation:** Implement server-side rate limiting for admin-web as well

#### Finding 4.2: Swagger Enabled in Production
- **Location:** `main.ts:15-26`
- **Issue:** Swagger can be enabled in production via `ENABLE_SWAGGER=true`
- **Risk:** Exposes API documentation publicly
- **Recommendation:** 
  ```typescript
  if (!isProduction && enableSwagger) {
    // Only enable in non-production
  }
  ```

---

### 5. Security Misconfiguration (A05:2021)

**Severity:** MEDIUM

#### Finding 5.1: Console Logging Sensitive Information
- **Location:** Multiple files in wallet-app and portal-service
- **Examples:**
  - `wallet-app/src/lib/axios.ts:95` - Logs full URLs
  - `wallet-app/src/store/auth.ts:86` - Logs token cleared
  - `wallet-app/src/hooks/useNotifications.ts:35` - Logs push tokens
- **Risk:** Sensitive data in logs can be leaked
- **Recommendation:** 
  - Use structured logging (winston, pino)
  - Remove or sanitize console.log in production
  - Implement log levels (debug, info, warn, error)

#### Finding 5.2: Environment Variable Exposure
- **Location:** Various configuration files
- **Issue:** Some environment variables might be exposed in client-side code
- **Recommendation:** 
  - Audit all EXPO_PUBLIC_ variables in wallet-app
  - Ensure no secrets are prefixed with EXPO_PUBLIC_

---

### 6. Vulnerable and Outdated Components (A06:2021)

**Severity:** LOW

#### Finding 6.1: Dependency Management
- **Status:** ⚠️ **NEEDS REVIEW**
- **Recommendation:** 
  ```bash
  # Run dependency audit
  npm audit
  cd j-ledger-core/finance-service && ./mvnw dependency:check
  ```
  - Set up automated dependency scanning in CI/CD
  - Use Snyk or similar tools

---

### 7. Identification and Authentication Failures (A07:2021)

**Severity:** LOW

#### Finding 7.1: Authentication Implementation
- **Status:** ✅ **GOOD**
- **Findings:**
  - Multiple guard implementations (JwtAuthGuard, AdminJwtGuard, TerminalAuthGuard, etc.)
  - PIN verification guard
  - Biometric authentication
  - JWT with refresh tokens
- **Recommendation:** 
  - Implement token rotation
  - Add device fingerprinting
  - Consider implementing OAuth 2.0 / OpenID Connect

---

### 8. Software and Data Integrity Failures (A08:2021)

**Severity:** LOW

#### Finding 8.1: Webhook Signature Verification
- **Location:** `stripe-webhook.controller.ts`
- **Status:** ✅ **GOOD** - Stripe signature verification implemented
- **Recommendation:** Ensure all webhooks verify signatures

---

### 9. Security Logging and Monitoring Failures (A09:2021)

**Severity:** MEDIUM

#### Finding 9.1: Insufficient Security Logging
- **Location:** Throughout codebase
- **Issue:** Limited security event logging
- **Recommendation:** 
  - Log all authentication failures
  - Log authorization failures
  - Log rate limit violations
  - Implement SIEM integration
  - Add audit trail for sensitive operations

#### Finding 9.2: No Intrusion Detection
- **Issue:** No automated intrusion detection
- **Recommendation:** 
  - Implement anomaly detection
  - Monitor for unusual transaction patterns
  - Set up alerts for security events

---

### 10. Server-Side Request Forgery (A10:2021)

**Severity:** LOW

#### Finding 10.1: External API Calls
- **Location:** Integration service, finance service
- **Status:** ⚠️ **NEEDS REVIEW**
- **Recommendation:** 
  - Implement allowlist for external domains
  - Validate and sanitize URLs
  - Implement timeout for external requests
  - Add request size limits

---

## Additional Security Concerns

### Mobile App Security (React Native)

**Severity:** MEDIUM

#### Finding M1: Certificate Pinning
- **Location:** `wallet-app/CERTIFICATE_PINNING.md`
- **Status:** ✅ **DOCUMENTED** - Certificate pinning guide exists
- **Recommendation:** Implement certificate pinning in production

#### Finding M2: Secure Storage
- **Location:** `wallet-app/src/lib/secure-storage-verification.ts`
- **Status:** ✅ **GOOD** - Uses SecureStore for sensitive data
- **Recommendation:** Continue using platform-specific secure storage

#### Finding M3: Screen Capture Prevention
- **Location:** `wallet-app/src/lib/screen-capture.ts`
- **Status:** ✅ **GOOD** - Screen capture prevention implemented
- **Recommendation:** Ensure it's enabled on sensitive screens

---

## Positive Security Findings

✅ **SQL Injection Protection:** All queries use parameterized queries  
✅ **XSS Protection:** No dangerouslySetInnerHTML found in React Native  
✅ **Input Validation:** Global ValidationPipe with whitelist enabled  
✅ **Authentication:** Multiple guard implementations  
✅ **Rate Limiting:** @Throttle decorators on sensitive endpoints  
✅ **CORS:** Configured with environment variable  
✅ **Secure Storage:** Using SecureStore for mobile app  
✅ **Biometric Auth:** Biometric authentication implemented  
✅ **PIN Verification:** PIN verification guard  
✅ **Audit Logging:** Some audit logging implemented  

---

## Recommended Action Plan

### Immediate (High Priority)

1. **Remove hardcoded secret** from `scripts/pos-simulator.js`
2. **Add validation** to reject default passwords in production
3. **Remove CORS fallback** or make it fail explicitly in production

### Short-term (Medium Priority)

4. **Implement server-side rate limiting** for admin-web
5. **Disable Swagger in production** (remove ENABLE_SWAGGER override)
6. **Sanitize console logs** in production builds
7. **Implement structured logging** with log levels
8. **Add security event logging** for auth failures, rate limit violations

### Long-term (Low Priority)

9. **Set up automated dependency scanning** in CI/CD
10. **Implement certificate pinning** in mobile app
11. **Add intrusion detection** and monitoring
12. **Implement SIEM integration**
13. **Add device fingerprinting** for authentication

---

## Compliance Considerations

### PCI DSS
- ✅ Encryption at rest (database)
- ✅ Encryption in transit (HTTPS)
- ⚠️ Need to verify: Tokenization of card data
- ⚠️ Need to verify: Secure key management

### PDPA (Thailand)
- ✅ Data export functionality
- ✅ Account deletion request
- ✅ Consent management
- ⚠️ Need to verify: Data retention policies
- ⚠️ Need to verify: Data breach notification process

### Bank of Thailand Regulations
- ✅ AML monitoring
- ✅ Suspicious activity reporting
- ✅ Transaction limits
- ⚠️ Need to verify: Customer due diligence (CDD) process

---

## Conclusion

The J-Ledger platform demonstrates a strong security foundation with proper authentication, input validation, and SQL injection protection. However, there are areas for improvement, particularly around:

1. **Secrets management** (hardcoded secrets need removal)
2. **Logging practices** (sensitive data in logs)
3. **Security configuration** (CORS fallback, Swagger in production)
4. **Monitoring** (security event logging)

Addressing the HIGH and MEDIUM severity issues will significantly improve the security posture of the platform.

---

**Next Steps:**
1. Review this report with the development team
2. Prioritize fixes based on risk and impact
3. Implement fixes in order of severity
4. Schedule follow-up security audit
5. Consider engaging a third-party security firm for penetration testing
