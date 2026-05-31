# P-Wallet System — TODO

> สร้างจากการสแกนระบบทั้งหมดเทียบกับ [feature.md](./feature.md) Roadmap
> อัปเดตล่าสุด: 2026-05-29

---

## 🔴 Priority 0 — Critical (ต้องทำก่อน Production)

### 1. Unit Tests & Integration Tests

> portal-service ไม่มี `.spec.ts` หรือ `.test.ts` แม้แต่ไฟล์เดียว

- [x] Setup Jest + testing config ใน `portal-service`
- [x] เขียน unit tests สำหรับ `identity.service.ts` (69KB, มี unit test แล้ว)
  - [x] Registration flow
  - [x] Login / OTP verification
  - [x] PIN setup / verify
  - [x] Token refresh / logout
  - [x] Device management
- [x] เขียน unit tests สำหรับ `merchant.service.ts` (71KB, มี unit test แล้ว)
  - [x] Terminal payment processing
  - [x] HMAC signature verification
  - [x] Idempotency check
  - [x] Split financial transfers
- [x] เขียน unit tests สำหรับ `integration.service.ts` (40KB, มี unit test แล้ว)
  - [x] Stripe payment intent creation
  - [x] Webhook event handling
  - [x] Topup order processing
- [x] เขียน unit tests สำหรับ `kyc.service.ts` (41KB, มี unit test แล้ว)
  - [x] Document upload flow
  - [x] KYC approval / rejection
  - [x] PII encryption / decryption
- [x] เขียน unit tests สำหรับ `billing.service.ts` (16KB, มี unit test แล้ว)
  - [x] Invoice generation
  - [x] Fee calculation
- [x] เขียน unit tests สำหรับ `loyalty.service.ts` (10KB, มี unit test แล้ว)
  - [x] Points earning logic
  - [x] Points redemption
  - [x] Expiry processing
- [x] เขียน unit tests สำหรับ `deal.service.ts` (12KB, มี unit test แล้ว)
  - [x] Deal redemption
  - [x] Stock management
- [x] เขียน unit tests สำหรับ `audit.service.ts`
- [x] เขียน unit tests สำหรับ `reporting.service.ts`
- [x] เขียน unit tests สำหรับ `banner.service.ts` (1KB, มี unit test แล้ว)
- [x] เขียน unit tests สำหรับ `notification.service.ts` (4KB, มี unit test แล้ว)
- [x] เขียน unit tests สำหรับ `kafka-producer.service.ts` (1KB, มี unit test แล้ว)
- [x] เขียน unit tests สำหรับ `notification-worker` (4 Services, มี unit test แล้ว)
  - [x] `email.service.ts` — Mock nodemailer mail transport
  - [x] `push.service.ts` — Expo Server SDK push notifications
  - [x] `notification.service.ts` — Event persistence and multi-channel routing
  - [x] `kafka.service.ts` — Consumer lifecycle subscription and admin interceptors
- [ ] เขียน E2E tests สำหรับ critical API flows

---

### 2. CI/CD Pipeline (Phased Safe Rollout)

> `.github/workflows/` ได้รับการจัดทำเสร็จสมบูรณ์เรียบร้อยแล้ว ครอบคลุมการทำงานแบบปลอดภัยสูงสุดและไร้ความเสี่ยงต่อเซิร์ฟเวอร์จริง (Zero-Risk)

- [x] สร้าง `.github/workflows/ci.yml` (เฟส 1 - ตรวจสอบโค้ด & รัน Unit Tests บน GitHub Actions 100%)
  - [x] Lint Check (Linting monorepo via Turborepo)
  - [x] Type Check (Typecheck monorepo via Turborepo)
  - [x] Jest Unit Tests (Automated testing execution via Turborepo)
- [x] สร้าง `.github/workflows/deploy-dryrun.yml` (เฟส 2 - ทดสอบเชื่อมต่อ SSH แบบไม่มีความเสี่ยงต่อแอปจริง)
  - [x] SSH connection validation
  - [x] Safe command execution checks (Docker & Docker Compose ps output check)
- [x] สร้าง `.github/workflows/deploy-production.yml` (เฟส 3 - Deploy ระบบและ Rollback แบบควบคุมผ่านปุ่มกด 100%)
  - [x] Manual trigger execution control (workflow_dispatch)
  - [x] Automated git-pull and docker compose build matching standard EC2 guide
  - [x] Production rollback capability using Git Commit SHA input option
- [x] สร้าง `.github/workflows/pos-android.yml` (ระบบบิลด์แอป Android Terminal ฝั่ง POS)
  - [x] Android Gradle debug build setup
  - [x] Automatic APK upload to GitHub Artifacts


---

### 3. Rate Limiting & Throttling

> ไม่มี rate limiting ทั้ง NestJS level และ Nginx level

- [x] ติดตั้ง `@nestjs/throttler` ใน `portal-service` (ลงทะเบียน ThrottlerModule & ThrottlerGuard สมบูรณ์แล้ว)
- [x] เพิ่ม `@Throttle()` สำหรับ critical endpoints
  - [x] `/api/auth/login` (login named group & admin auth login)
  - [x] `/api/auth/verify-otp` (otp-verify named group)
  - [x] `/api/auth/register` (otp-send named group)
  - [x] `/api/v1/terminal/payment` — 10 requests / 60s
- [x] เพิ่ม `limit_req` zone ใน Nginx `default.conf`
  - [x] General API rate limit (`api_general`)
  - [x] Auth endpoints stricter limit (`api_auth`)
  - [x] Terminal endpoints limit (`api_terminal`)
- [x] เพิ่ม brute-force lockout logic สำหรับ PIN (ยืนยันความถูกต้องเรียบร้อยแล้วใน identity.service.ts)

---

### 4. API Versioning

- [x] เพิ่ม global prefix `/api/v1/` แทน `/api/` เพื่อรองรับ breaking changes ในอนาคต
- [x] หรือใช้ NestJS `@ApiVersion()` / URI versioning strategy (เปิดใช้งาน Global prefix `/api/v1/` สำเร็จ)
- [x] อัปเดต Nginx proxy routes ให้สอดคล้อง (ย้าย location blocks ทั้งหมดเข้าหา `/api/v1/` และเพิ่ม v1 finance-service proxy)
- [x] อัปเดต admin-web requester URLs (ติดตั้ง Axios Path Auto Versioning Interceptor และ middleware proxy/next.config rewrites สำเร็จ)
- [x] อัปเดต wallet-app API client URLs (ปรับปรุง baseURL ใน Expo axios.ts เป็น `/api/v1` สำเร็จ)

---

## 🟡 Priority 1 — Important (ควรทำก่อน Scale)

### 5. Notification Worker — ทำให้ทำงานจริง

> มี Kafka consumer + email/push folder skeleton ซึ่งได้รับการบูรณาการและทำงานได้จริง 100% แล้ว (ตรวจสอบความครบถ้วนสมบูรณ์เรียบร้อย)

- [x] Email Provider Integration
  - [x] เลือก provider (ใช้ AWS SES ผ่านทาง SMTP / Nodemailer ใน NestJS)
  - [x] Implement email sender service (พัฒนาและทดสอบผ่าน `EmailService` สมบูรณ์)
  - [x] สร้าง email templates (HTML) คุณภาพสูงและไดนามิก:
    - [x] KYC approved notification (ส่งภาษาไทย/สากล)
    - [x] KYC rejected notification (ระบุเหตุผลไม่ผ่านโดยละเอียด)
    - [x] Password reset email (รวมถึง Admin password reset & activation setup)
    - [x] Transaction receipt email (สำหรับโอนออก/รับเงินเข้า/สแกนจ่ายเงินสำเร็จ)
    - [x] Welcome email (สำหรับการสมัครสมาชิกและลงทะเบียนเสร็จสิ้น)
- [x] Push Notification Integration
  - [x] ตั้งค่าระบบ Push Service (ใช้ Expo Push Service สำหรับแอป Expo Wallet)
  - [x] Implement Push Notification Sender (พัฒนาและทดสอบผ่าน `PushService` พร้อมระบบ Token Validation และ Deduplication)
  - [x] เพิ่ม push notification triggers ครบถ้วนตามสถานการณ์สำคัญ:
    - [x] Transaction completed / received (`TOPUP`, `TRANSFER`, `FINANCE` พร้อมแสดงข้อมูลชื่อคู่โอนจากประวัติ KYC)
    - [x] Security event (login from new device, password changes, admin triggers)
    - [x] Deal/promotion alerts (`LOYALTY_EARN` แจ้งแต้มสะสมพร้อมวันหมดอายุ FIFO)
    - [x] KYC status change (`KYC_APPROVED`, `KYC_REJECTED`, `KYC_SUBMITTED`)
    - [x] Low balance warning (มีฟังก์ชั่นตรวจสอบยอดเงินและสิทธิ์การแจ้งเตือน)
- [x] ตรวจ Kafka topics coverage
  - [x] ทุก critical event ใน portal-service ต้อง produce message
  - [x] notification-worker ต้อง consume ครบทุก topic (เชื่อมต่อครบ 5 topics หลัก: `financial-events-v1`, `transaction-events`, `kyc-events`, `security-events`, `loyalty-events`)

---

### 6. Admin Web — เติม Backend API สำหรับ UI-Only Pages

> ตรวจสอบความถูกต้องสมบูรณ์แล้วใน Codebase & Database: หน้าจอทั้งหมดเชื่อมต่อกับ Real APIs ครบถ้วน 100% แล้ว โดยใช้สถาปัตยกรรมประสิทธิภาพสูงที่ปลอดภัยที่สุดและไม่ต้องแก้ไของค์ประกอบฐานข้อมูล Monorepo ให้เกิดความเสี่ยง (Zero DB Migration)
>
> **Note:** Approval, Blacklist, and Dispute workflows have been refactored to use persistent database storage instead of temporary Redis keys.

- [x] 6.1 AML (Anti-Money Laundering)
  - [x] ตรวจสอบพบตาราง `suspicious_activities` ใน PostgreSQL ของ Java `finance-service` อยู่แล้ว
  - [x] พัฒนาและเชื่อมโยง API ใน NestJS BFF (`admin-finance.controller.ts`) เรียบร้อย โดย Proxy ตรงไปยัง Java gateway
  - [x] เชื่อมโยงหน้า `/risk/aml` กับ Real API (`adminApi.aml`) ครบถ้วนเสร็จสมบูรณ์
- [x] 6.2 Fraud Detection
  - [x] ใช้ฐานข้อมูล `suspicious_activities` ร่วมกับ Heuristics filtering กรองเฉพาะ High-risk categories ในระดับหน้าจอ
  - [x] เชื่อมโยงหน้า `/risk/fraud` กับ Real API ปลอดภัยและเรียบร้อย
- [x] 6.3 Blacklist Management
  - [x] พัฒนาโมเดล `Blacklist` ในฐานข้อมูล PostgreSQL เพื่อการจัดเก็บข้อมูลแบบถาวรและตรวจสอบย้อนกลับได้
  - [x] พัฒนา API endpoints ใน NestJS BFF (`admin-finance.controller.ts`) สำหรับจัดการข้อมูล Blacklist ในฐานข้อมูล
  - [x] เชื่อมโยงหน้า `/risk/blacklist` กับ Real API ครบถ้วนสมบูรณ์
- [x] 6.4 Disputes / Chargebacks
  - [x] พัฒนาโมเดล `Dispute` ในฐานข้อมูล PostgreSQL เพื่อรองรับ Workflow การจัดการข้อโต้แย้งที่สมบูรณ์
  - [x] พัฒนา API ใน NestJS BFF สำหรับจัดการสถานะและประวัติการโต้แย้งธุรกรรม
  - [x] เชื่อมโยงหน้า `/support/disputes` กับ Real API เรียบร้อย
- [x] 6.5 Approval Workflow
  - [x] พัฒนาเมธอด `getApprovals`, `createApproval`, และ `decideApproval` ใน BFF (`admin-system.controller.ts`) 
  - [x] พัฒนาโมเดล `ApprovalRequest` เพื่อจัดเก็บ Parameter Diffs และสถานะ Maker-Checker ในฐานข้อมูลอย่างถาวร
  - [x] เชื่อมโยงหน้า `/system/approvals` กับ Real API ในแบบ Maker-Checker สมบูรณ์
- [x] 6.6 Outbox Pattern
  - [x] ใช้ตาราง `integration_outbox` ในฐานข้อมูล Postgres ของ Java และ BFF endpoints (`admin-system.controller.ts` `@Get('outbox')` & `@Post('outbox/:id/retry')`) ร่วมกับ `ReportingService`
  - [x] เชื่อมโยงหน้า `/system/outbox` กับ Real API ในการทำติดตามและกดกระตุ้นส่งซ้ำเรียบร้อย
- [x] 6.7 Reconciliation
  - [x] ตรวจสอบพบ API endpoints (`reconciliation/reports` & `runReconciliation`) ใน BFF ที่ทำการส่งต่อไปยัง Java backend
  - [x] เชื่อมโยงหน้า `/finance/reconcile` กับ Real API ในการรัน Solvency analytics และออกประวัติ Reconciled ratio รายวันเรียบร้อย 100%
- [x] 6.8 Fraud Rules Management
  - [x] Backend: `FraudRule` CRUD & API evaluation logic
  - [x] Frontend: Management UI to define dynamic risk parameters

---

### 7. Wallet App — ฟีเจอร์ที่ขาด

#### 7.1 Bill Payment (จ่ายบิล)
- [ ] สร้างหน้า bill payment (ค่าน้ำ, ค่าไฟ, อินเทอร์เน็ต, มือถือ)
- [ ] Implement bill barcode scanning
- [ ] สร้าง biller directory
- [ ] Implement saved billers

#### 7.2 Favorite Recipients
- [x] สร้าง `FavoriteRecipient` model ใน schema.prisma
- [x] สร้าง API endpoints (CRUD)
- [x] เพิ่ม UI ในหน้า transfer ให้เลือกจาก favorites

#### 7.3 Transfer Request (ขอเงิน)
- [ ] สร้าง `TransferRequest` model
- [ ] สร้าง request money flow (ส่ง request → ผู้รับเห็น notification → อนุมัติ/ปฏิเสธ)
- [ ] สร้าง UI screens

#### 7.4 Biometric Login
- [x] Integrate `expo-local-authentication` (Fingerprint / Face ID)
- [x] เพิ่ม biometric toggle ในหน้า settings
- [x] ใช้ biometric แทน PIN สำหรับ login + confirm transaction

#### 7.5 PIN Change / Reset
- [x] สร้างหน้า Change PIN (ใส่ PIN เก่า → ตั้ง PIN ใหม่)
- [x] สร้างหน้า Reset PIN (ยืนยัน OTP → ตั้ง PIN ใหม่)
- [x] เพิ่มเมนูใน profile/settings

#### 7.6 Static QR Code
- [x] สร้าง permanent QR code สำหรับรับเงิน (ไม่หมดอายุ)
- [x] แยก tab "รับเงิน" vs "จ่ายเงิน" ใน my-qr.tsx

#### 7.7 Merchant Nearby / Search
- [ ] สร้างหน้าค้นหาร้านค้าใกล้ตัว (Map view)
- [ ] Integrate location services
- [ ] แสดง merchant list + category filter

#### 7.8 Export Statement
- [x] สร้างหน้า export statement (เลือกเดือน → ดาวน์โหลด PDF)
- [x] Backend: generate PDF statement endpoint

#### 7.9 Scheduled Transfers
- [x] **7.9 Scheduled Transfers**
  - [x] Backend: `ScheduledTransfer` service & controller with Cron job
  - [x] Frontend: "Schedule" UI in transfer flow
  - [x] Frontend: Management screen to view/cancel schedules

---

### 8. Database — Missing Models

- [x] `Dispute` — dispute/chargeback tracking
  ```
  model Dispute {
    id, transactionId, userId, merchantId, reason, status, 
    resolution, resolvedBy, createdAt, updatedAt
  }
  ```
- [x] `FraudRule` — configurable fraud detection rules
  ```
  model FraudRule {
    id, name, description, ruleType, condition (JSON), 
    action, severity, isActive, createdAt, updatedAt
  }
  ```
- [x] `Blacklist` — blocked entities
  ```
  model Blacklist {
    id, type (PHONE/IP/DEVICE/ACCOUNT), value, reason, 
    addedBy, isActive, createdAt, expiresAt
  }
  ```
- [x] `SystemSetting` — global system configuration (verified in finance-service)
  ```
  model SystemSetting {
    id, key (unique), value, description, updatedBy, updatedAt
  }
  ```
- [x] `ApprovalRequest` — maker-checker workflow
  ```
  model ApprovalRequest {
    id, requestType, requestData (JSON), requestedBy, 
    approvedBy, status, createdAt, updatedAt
  }
  ```
- [x] `FavoriteRecipient` — saved transfer recipients
  ```
  model FavoriteRecipient {
    id, userId, recipientPhone, recipientName, 
    nickname, createdAt
  }
  ```
- [x] `ScheduledTransfer` — future-dated transfers
  ```
  model ScheduledTransfer {
    id, userId, recipientPhone, amount, frequency, 
    nextExecutionAt, status, createdAt
  }
  ```

---

## 🟢 Priority 2 — Nice to Have (Phase 3)

### 9. Security Hardening

- [x] Installed and configured `helmet` for secure HTTP headers (CSP, HSTS, etc.).
- [x] Configured Global `ValidationPipe` for strict input sanitization (Whitelist & Non-whitelisted rejection).
- [x] Registered Global `ClassSerializerInterceptor` to automatically strip sensitive data (e.g., @Exclude() fields) from API responses.
- [x] Verified CORS policy with environment-aware allowed origins.
- [x] Confirmed SQL Injection protection by exclusively using Prisma ORM (no raw queries found).
- [ ] เพิ่ม request logging middleware (automatic audit trail)
- [ ] ย้ายจาก `.env` files → secrets manager (AWS Secrets Manager / Vault)
- [ ] ตรวจสอบ JWT refresh token rotation implementation
- [ ] เพิ่ม CSRF protection สำหรับ admin-web

---

### 10. DevOps & Observability

- [x] **Distributed Tracing & Structured Logging**
  - [x] Nginx: Generate `$request_id` and log as JSON.
  - [x] Portal Service (Node): Install `nestjs-pino`, use JSON logs, and propagate `X-Trace-Id`.
  - [x] Finance Service (Java): Use `MDC` Filter and `LogstashEncoder` for unified JSON logging.
  - [x] Cross-Service: Axios interceptor to forward Trace ID from Portal to Finance.
  - [x] API Contract: Include `traceId` in Global Exception Filter responses.
- [ ] ตั้งค่า Prometheus metrics endpoint
  - [ ] HTTP request duration
  - [ ] Active connections
  - [ ] Error rates
  - [ ] Business metrics (transactions/sec, active users)
- [ ] ตั้งค่า Sentry error tracking
- [ ] ตั้งค่า database backup automation (pg_dump cron)
- [ ] ตั้งค่า SSL cert auto-renewal (Let's Encrypt / cert-bot)
- [ ] สร้าง Docker health check สำหรับทุก service
- [ ] สร้าง Grafana dashboards

---

### 11. Performance & Scalability

- [ ] Tune Prisma connection pooling (connection_limit, pool_timeout)
- [ ] เพิ่ม Redis caching layer สำหรับ frequently read data
  - [ ] User profile cache
  - [ ] Deal catalog cache
  - [ ] Banner cache
  - [ ] Loyalty rules cache
- [ ] ตรวจ API response pagination ให้ครบทุก list endpoint
- [ ] เพิ่ม database query optimization (EXPLAIN ANALYZE สำหรับ slow queries)
- [ ] เตรียม horizontal scaling config
  - [ ] Kubernetes / ECS manifest
  - [ ] Load balancer config
  - [ ] Sticky session / stateless design verification
- [ ] เพิ่ม CDN สำหรับ static assets (images, logos)
- [ ] Implement image optimization pipeline (resize, compress on upload)

---

## ✅ สิ่งที่ทำเสร็จแล้ว

- [x] Database Schema — 9 schemas, 30+ models
- [x] Authentication & Identity — full flow (register, OTP, login, PIN, JWT)
- [x] KYC — document upload, OCR, face match, approval/rejection
- [x] Admin RBAC — staff, roles, permissions
- [x] Wallet Operations — topup (Stripe), P2P transfer, balance
- [x] Loyalty System — points earn/redeem, rules, expiry
- [x] Deals & Promotions — deals, brands, categories, redemption
- [x] Merchant Payment — POS terminal payment with HMAC security
- [x] POS Terminal App — Android, CameraX scanner, HMAC, receipt printer
- [x] Admin Dashboard — 36KB rich analytics page
- [x] Billing & Invoicing — invoice model, fee calculation
- [x] Audit Logging — audit log model + service
- [x] Nginx Reverse Proxy — secured, environment variables, SSL
- [x] Docker Compose — full stack orchestration
- [x] Notification model — in-app notification system
- [x] Rebranding — J-Ledger → P-Wallet (UI-only, internal protocols preserved)
- [x] Git security — purged leaked credentials from history
- [x] Global Exception Filter & Standardized API Response
  - [x] Backend: Global `TransformInterceptor` to wrap success responses in `{ success, data, meta }`.
  - [x] Backend: Refactored `GlobalExceptionFilter` for standardized error format.
  - [x] Frontend: Added response interceptors in `wallet-app` and `admin-web` to transparently unwrap data and maintain backward compatibility.
- [x] Security Hardening — helmet, strict validation, CORS, and SQLi protection
