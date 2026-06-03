# J-Ledger Portal – TODO / Code Health Checklist

> สแกนเมื่อ: 2026-06-03
> สแกนโดย: Antigravity AI Pair Programmer

---

## 🔴 Critical — Security Issues (ต้องแก้ก่อน Production)

### SEC-01: Hardcoded Fallback Secrets
- [ ] `apps/admin-web/src/lib/auth/jwt.ts:16` — JWT secret fallback `'jledger-admin-super-secret-2024-dev-key-32chars'` อยู่ใน source code ถ้าลืมตั้ง env variable ก็จะใช้ key นี้ใน production ได้
  - **Fix**: ให้ throw error ถ้า `ADMIN_JWT_SECRET` ไม่มี (เหมือนที่ proxy.ts ทำแล้ว)
- [ ] `apps/portal-service/src/core/common/guards/internal-auth.guard.ts:15` — fallback secret `'jledger_ecosystem_secret_2024'` hardcoded ถ้าไม่ตั้ง env จะใช้ค่านี้
  - **Fix**: throw error เมื่อ `JLEDGER_INTERNAL_SECRET` ไม่มี
- [ ] `apps/portal-service/src/modules/reporting/reporting.service.ts:22` — fallback `'default_internal_secret'` hardcoded
  - **Fix**: ให้ ConfigService throw error เมื่อไม่มีค่า

### SEC-02: OTP/Token ถูก Log ใน Production
- [x] `apps/portal-service/src/modules/identity/services/user-security.service.ts:302` — เปลี่ยนเป็น `this.logger.warn` + เพิ่ม comment warning (เก็บ OTP ไว้ชั่วคราวเพราะยังไม่มีระบบส่งจริง)
- [x] `apps/portal-service/src/modules/identity/services/user-security.service.ts:535` — เปลี่ยนเป็น log masked token `PAY-XXXX...`
- [x] `apps/portal-service/src/modules/kyc/services/kyc-process.service.ts:145` — ลบ console.log เลขบัตรประชาชนเรียบร้อย
- [x] `apps/portal-service/src/modules/kyc/services/kyc-process.service.ts:192` — ลบ console.log ข้อมูล KYC และเปลี่ยนเป็น debug log ข้อความระบุสิทธิ์โดยไม่มี PII

### SEC-03: Insecure Random สำหรับ Security-Critical Operations
- [ ] `apps/portal-service/src/modules/identity/services/user-security.service.ts:281` — ใช้ `Math.random()` สร้าง OTP → ต้องเปลี่ยนเป็น `crypto.randomInt()`
- [ ] `apps/portal-service/src/modules/identity/services/user-profile.service.ts:191` — ใช้ `Math.random()` สร้าง OTP → ต้องเปลี่ยนเป็น `crypto.randomInt()`
- [ ] `apps/portal-service/src/modules/identity/services/user-registration.service.ts:698` — ใช้ `Math.random()` สร้าง OTP → ต้องเปลี่ยนเป็น `crypto.randomInt()`
- [ ] `apps/admin-web/src/lib/auth/csrf.ts:10` — ใช้ `Math.random()` สร้าง CSRF token → ไม่ปลอดภัยเพียงพอ

### SEC-04: Cookie sameSite ไม่ได้ตั้งทั้งระบบ
- [ ] `apps/admin-web/src/app/actions/auth.ts` — cookies ทั้งหมด (admin_session, refresh_token, user_id, user_role, user_permissions) ไม่ได้ตั้ง `sameSite` → ต้องเพิ่ม `sameSite: 'lax'` หรือ `'strict'`
  - proxy.ts ตั้ง sameSite แล้วแต่ auth actions ไม่ได้ตั้ง → inconsistent

### SEC-05: CSRF Token ไม่ปลอดภัย
- [ ] `apps/admin-web/src/lib/auth/csrf.ts` — CSRF token เป็นแค่ base64 ของ timestamp + random + secret → ใครที่รู้ secret สามารถ forge ได้ ต้องใช้ HMAC signing

### SEC-06: KYC ID Card Deduplication Bypass
- [ ] `apps/portal-service/src/modules/kyc/services/kyc-process.service.ts:195,316-317` — TODO comment อยู่: mock mode append userId ลง idCardToken → production ต้อง hash เฉพาะ idCardNumber เพื่อป้องกัน 1 คนใช้บัตรหลายบัญชี

---

## 🟠 High — Code Quality & Correctness

### CQ-01: proxy.ts ตรวจ JWT ซ้ำซ้อน
- [ ] `apps/admin-web/src/proxy.ts:40-92` — เรียก `verifyToken()` (jose) แล้ว ก็ยังเรียก `jwtVerify()` อีกครั้งด้วย SECRET แยก → ซ้ำซ้อน ควรใช้ verifyToken ครั้งเดียว

### CQ-02: `any` Type ใช้มากเกินไป (~438 แห่ง)
- [ ] `apps/admin-web/src/lib/admin-api.ts` — หลาย function return `any` แทน typed response เช่น `findAll: (query: any)`, `apiClient.get<any>()`
- [ ] `apps/portal-service/src/modules/reporting/reporting.service.ts` — ใช้ `any` ในหลาย method
- [ ] Controllers หลายตัวใช้ `@Req() req: any` แทน typed request
- [ ] **Scope**: 438 instances ทั่วทั้ง project → ค่อยๆ fix เป็น sprint

### CQ-03: Console.log Debug Statements ต้องลบ
- [ ] `apps/portal-service/src/admin/finance/admin-finance.controller.ts:93,96` — `console.log(account)`, `console.log(error)` 
- [ ] `apps/portal-service/src/user/identity/identity.controller.ts:158-171` — log phone number และ login response
- [ ] `apps/portal-service/src/modules/admin/admin.service.ts:403` — `console.log('roleName', roleName)`
- [ ] `apps/admin-web/src/app/actions/auth.ts:41-96` — login flow มี console.log 8 บรรทัด
- [ ] `apps/admin-web/src/app/actions/system.ts:9` — `console.log('System Settings: ', response)`
- [ ] `apps/admin-web/src/app/(dashboard)/dashboard/page.tsx:177` — `console.log('Liquidity Stats:', liquidityStats)`
- [ ] `apps/admin-web/src/app/(dashboard)/system/admins/page.tsx:108` — `console.log('staffList', staffList)`
- [ ] **Action**: ทั้งหมดควรใช้ structured logger (Pino) แทน console.log, หรือลบออกถ้าเป็น debug

### CQ-04: Error Console Suppression (Anti-pattern)
- [ ] `apps/admin-web/src/app/(dashboard)/dashboard/page.tsx:42-56` — Override `console.error` และ `console.warn` เพื่อซ่อน error → ซ่อน bug จริง ควรแก้ที่ต้นเหตุ

### CQ-05: Swallowed Errors (Empty Catch Blocks)
- [ ] `apps/portal-service/src/modules/integration/services/transaction-history.service.ts:224` — `catch {}` ว่างเปล่า
- [ ] `apps/admin-web/src/app/(dashboard)/system/admins/page.tsx:116,201,220` — `catch {}` ไม่แสดง error
- [ ] `apps/admin-web/src/app/(dashboard)/system/roles/page.tsx:78` — `catch {}` ไม่ handle
- [ ] `apps/admin-web/src/app/(dashboard)/transactions/[id]/page.tsx:106` — `catch {}` ไม่ handle

### CQ-06: Incomplete Feature Implementations (TODO Comments)
- [ ] `apps/portal-service/src/modules/identity/services/user-admin.service.ts:210` — "TODO: Implement get suspicious activities logic"
- [ ] `apps/portal-service/src/modules/identity/services/user-admin.service.ts:215` — "TODO: Implement AMLO reporting logic"
- [ ] `apps/portal-service/src/modules/identity/services/user-security.service.ts:118` — "TODO: Implement device verification logic" → returns `{ success: true }` always
- [ ] `apps/portal-service/src/modules/identity/services/user-security.service.ts:346` — "TODO: Implement biometric challenge generation"
- [ ] `apps/portal-service/src/modules/identity/services/user-security.service.ts:351` — "TODO: Implement biometric verification logic" → returns `{ success: true }` always ⚠️ ปล่อยทุกคนผ่าน
- [ ] `apps/portal-service/src/modules/reporting/reporting.service.ts:158` — "TODO: Get all users from identity module" → return placeholder data
- [ ] `apps/admin-web/src/lib/auth/audit.ts:18` — "TODO: Send to admin-api for persistent storage" → audit log เขียนแค่ console.log

### CQ-07: DTO ที่ยัง TODO อยู่
- [ ] `apps/portal-service/src/user/merchant/dto/apply-merchant.dto.ts:27` — `@IsOptional() // TODO: Make optional temporarily, should be required in production`

---

## 🟡 Medium — Architecture & Readability

### ARCH-01: Audit Log ไม่ Persistent
- [ ] `apps/admin-web/src/lib/auth/audit.ts` — `logAuditEvent()` เขียนแค่ `console.log('[AUDIT]', ...)` ไม่ได้ส่งไป backend → ข้อมูล audit หายเมื่อ restart
  - **Fix**: ส่งไป `/api/admin/audit` endpoint

### ARCH-02: Rate Limit ฝั่ง Admin-Web เป็น In-Memory
- [ ] `apps/admin-web/src/lib/auth/rate-limit.ts` — ใช้ `Map` in-memory + `setInterval` cleanup → stateless, รีเซ็ตทุกครั้งที่ restart, ไม่ shared ข้าม instances
  - **Fix**: ควรใช้ Redis-backed rate limiting (backend มีอยู่แล้วใน ThrottlerModule)

### ARCH-03: Mock/Simple KYC Mode ยังเปิดอยู่
- [ ] `apps/portal-service/src/modules/kyc/services/kyc-process.service.ts:155-297` — `uploadIdCardSimple()` ใส่ hardcoded mock data (idCardNumber: '1234567890123', ชื่อ: สมชาย เข็มกลัด) → production ต้องมีวิธีปิด mock mode

### ARCH-04: Reporting Revenue Calculation Hardcoded
- [ ] `apps/portal-service/src/modules/reporting/reporting.service.ts:151` — `revenue: totalAmount * 0.01` // Assuming 1% fee → hardcoded
- [ ] `apps/portal-service/src/modules/reporting/reporting.service.ts:229` — `fallbackMdrYield = networkVolume * 0.03` hardcoded 3% MDR

### ARCH-05: `@ts-ignore` / `as any` Overuse (~161 instances)
- [ ] 161 instances ของ `as any`, `@ts-ignore`, `eslint-disable` → ลด type safety
- [ ] ควรค่อยๆ แก้เป็น proper types เป็น sprint

### ARCH-06: Inconsistent Error Patterns in Services
- [ ] `apps/portal-service/src/modules/kyc/services/kyc-admin.service.ts:37,156,162` — ใช้ `throw new Error(...)` แทน NestJS HttpException → GlobalExceptionFilter จะ return 500 แทน 400/409
  - **Fix**: เปลี่ยนเป็น `throw new BadRequestException(...)` หรือ `ConflictException`

---

## 🟢 Low — Cleanup & Polish

### CLN-01: ลบ scratch/lint files
- [ ] `lint_output.txt` ใน project root → ควรอยู่ใน .gitignore
- [ ] `scratch/` directory ใน project root → ถ้าเป็น temp file ควร gitignore

### CLN-02: Unused Imports / Dead Code
- [ ] `apps/admin-web/src/proxy.ts:2` — import `{ jwtVerify } from 'jose'` ถูกใช้ซ้ำกับ `verifyToken` → ลบ direct import ได้
- [ ] สแกนด้วย `eslint --fix` เพื่อหา unused imports

### CLN-03: Missing Test Coverage
ส่วนที่ไม่มี test:
- [ ] Admin auth controller (login, refresh, logout, reset-password flows)
- [ ] Admin dashboard controller
- [ ] Admin merchant controller
- [ ] All admin-web server actions (auth.ts, transfer.ts, system.ts)
- [ ] Fraud service (fraud.service.ts)
- [ ] Scheduled transfer service
- [ ] User security service (PIN, biometric, device, pay-token flows)

### CLN-04: Hardcoded Dev URLs
- [ ] `apps/portal-service/src/modules/reporting/reporting.service.ts:18` — default `'http://localhost:8081'`
- [ ] `apps/admin-web/src/lib/api-config.ts:14-16` — default localhost/docker URLs
  - ไม่ใช่ bug แต่ควรมี validation ว่าต้องตั้ง env ใน production

### CLN-05: Pino Logger ถูกตั้งแต่ Console.log ยังใช้อยู่
- [ ] Backend ตั้ง `nestjs-pino` เป็น global logger แต่หลาย service/controller ยังใช้ `console.log` → ควร migrate ทั้งหมดให้ใช้ `this.logger.log()` / `this.logger.debug()`

### CLN-06: Inconsistent Thai/English Error Messages
- [ ] `apps/portal-service/src/modules/identity/services/user-security.service.ts:236` — `'รหัส PIN เดิมไม่ถูกต้อง'` (Thai)
- [ ] `apps/portal-service/src/modules/identity/services/user-security.service.ts:141` — `'User not found'` (English)
  - ควรใช้ error code + i18n message mapping ไม่ hardcode ภาษาใน service layer

---

## ℹ️ Notes

### สิ่งที่ทำได้ดีแล้ว ✅
- ✅ GlobalExceptionFilter มี standardized error envelope (`ApiErrorResponse`)
- ✅ Throttle/Rate limiting ครอบคลุม sensitive endpoints (login, OTP, PIN, biometric, account deletion)
- ✅ Helmet + CORS configured properly
- ✅ JWT refresh token hashing (bcrypt) stored in DB
- ✅ Swagger ปิดใน production
- ✅ CORS origin validation required in production
- ✅ PII encryption (idCardNumber, thaiName) ด้วย AES-256
- ✅ `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true`
- ✅ Admin JWT secret length validation (≥32 chars)
- ✅ Trust proxy configured
- ✅ Trace ID middleware for request tracking
- ✅ No `dangerouslySetInnerHTML` / `innerHTML` usage (XSS safe)
- ✅ `.env` files properly gitignored
