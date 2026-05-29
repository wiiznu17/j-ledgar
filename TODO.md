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

### 2. CI/CD Pipeline

> `.github/` ไม่มี workflow file — มีแค่ folder `java-upgrade`

- [ ] สร้าง `.github/workflows/ci.yml`
  - [ ] Lint (ESLint) on PR
  - [ ] Type-check (`npm run check-types`)
  - [ ] Unit tests (`npm run test`)
  - [ ] Build validation
- [ ] สร้าง `.github/workflows/deploy-staging.yml`
  - [ ] Docker image build & push (ECR / GHCR)
  - [ ] Database migration (Prisma)
  - [ ] Deploy to staging
- [ ] สร้าง `.github/workflows/deploy-production.yml`
  - [ ] Manual approval gate
  - [ ] Production deployment
  - [ ] Rollback capability
- [ ] สร้าง `.github/workflows/pos-android.yml`
  - [ ] Android build (Gradle)
  - [ ] APK artifact upload

---

### 3. Rate Limiting & Throttling

> ไม่มี rate limiting ทั้ง NestJS level และ Nginx level

- [ ] ติดตั้ง `@nestjs/throttler` ใน `portal-service`
- [ ] เพิ่ม `@Throttle()` สำหรับ critical endpoints
  - [ ] `/api/auth/login` — 5 requests / 60s
  - [ ] `/api/auth/verify-otp` — 5 requests / 60s
  - [ ] `/api/auth/register` — 3 requests / 60s
  - [ ] `/api/v1/terminal/payment` — 10 requests / 60s
- [ ] เพิ่ม `limit_req` zone ใน Nginx `default.conf`
  - [ ] General API rate limit
  - [ ] Auth endpoints stricter limit
- [ ] เพิ่ม brute-force lockout logic สำหรับ PIN (มี `pinAttempts` field อยู่แล้ว แต่ต้องตรวจ implementation)

---

### 4. API Versioning

- [ ] เพิ่ม global prefix `/api/v1/` แทน `/api/` เพื่อรองรับ breaking changes ในอนาคต
- [ ] หรือใช้ NestJS `@ApiVersion()` / URI versioning strategy
- [ ] อัปเดต Nginx proxy routes ให้สอดคล้อง
- [ ] อัปเดต admin-web requester URLs
- [ ] อัปเดต wallet-app API client URLs

---

## 🟡 Priority 1 — Important (ควรทำก่อน Scale)

### 5. Notification Worker — ทำให้ทำงานจริง

> มี Kafka consumer + email/push folder skeleton แต่ยังไม่ integrate จริง

- [ ] Email Provider Integration
  - [ ] เลือก provider (AWS SES / SendGrid / Resend)
  - [ ] Implement email sender service
  - [ ] สร้าง email templates (HTML)
    - [ ] KYC approved notification
    - [ ] KYC rejected notification
    - [ ] Password reset email
    - [ ] Transaction receipt email
    - [ ] Welcome email
- [ ] Push Notification Integration
  - [ ] ตั้งค่า Firebase Cloud Messaging (FCM)
  - [ ] Implement FCM push sender
  - [ ] เพิ่ม push notification triggers:
    - [ ] Transaction completed / received
    - [ ] Security event (login from new device)
    - [ ] Deal/promotion alerts
    - [ ] KYC status change
    - [ ] Low balance warning
- [ ] ตรวจ Kafka topics coverage
  - [ ] ทุก critical event ใน portal-service ต้อง produce message
  - [ ] notification-worker ต้อง consume ครบทุก topic

---

### 6. Admin Web — เติม Backend API สำหรับ UI-Only Pages

#### 6.1 AML (Anti-Money Laundering)
- [ ] สร้าง `AmlRule` model ใน schema.prisma
- [ ] สร้าง `aml.service.ts` ใน portal-service
- [ ] สร้าง `admin-aml.controller.ts`
- [ ] เชื่อม `/risk/aml` page กับ real API

#### 6.2 Fraud Detection
- [ ] สร้าง `FraudRule` model ใน schema.prisma
- [ ] สร้าง `fraud.service.ts` ใน portal-service
- [ ] สร้าง `admin-fraud.controller.ts`
- [ ] เชื่อม `/risk/fraud` page กับ real API

#### 6.3 Blacklist Management
- [ ] สร้าง `Blacklist` model ใน schema.prisma (phone, IP, device)
- [ ] สร้าง `blacklist.service.ts` ใน portal-service
- [ ] สร้าง `admin-blacklist.controller.ts`
- [ ] เชื่อม `/risk/blacklist` page กับ real API

#### 6.4 Disputes / Chargebacks
- [ ] สร้าง `Dispute` model ใน schema.prisma
- [ ] สร้าง `dispute.service.ts` ใน portal-service
- [ ] สร้าง `admin-dispute.controller.ts`
- [ ] เชื่อม `/support/disputes` page กับ real API

#### 6.5 Approval Workflow
- [ ] สร้าง `ApprovalRequest` model ใน schema.prisma
- [ ] สร้าง approval workflow engine (maker-checker pattern)
- [ ] เชื่อม `/system/approvals` page กับ real API

#### 6.6 Outbox Pattern
- [ ] สร้าง `OutboxEvent` model ใน schema.prisma
- [ ] Implement transactional outbox pattern
- [ ] เชื่อม `/system/outbox` page กับ real API

#### 6.7 Reconciliation
- [ ] ขยาย `admin-reconciliation.controller.ts` (ปัจจุบัน 1.4KB เท่านั้น)
- [ ] Implement reconciliation logic ระหว่าง finance-service ledger กับ portal-service records
- [ ] เชื่อม `/finance/reconcile` page กับ real API

---

### 7. Wallet App — ฟีเจอร์ที่ขาด

#### 7.1 Bill Payment (จ่ายบิล)
- [ ] สร้างหน้า bill payment (ค่าน้ำ, ค่าไฟ, อินเทอร์เน็ต, มือถือ)
- [ ] Implement bill barcode scanning
- [ ] สร้าง biller directory
- [ ] Implement saved billers

#### 7.2 Favorite Recipients
- [ ] สร้าง `FavoriteRecipient` model ใน schema.prisma
- [ ] สร้าง API endpoints (CRUD)
- [ ] เพิ่ม UI ในหน้า transfer ให้เลือกจาก favorites

#### 7.3 Transfer Request (ขอเงิน)
- [ ] สร้าง `TransferRequest` model
- [ ] สร้าง request money flow (ส่ง request → ผู้รับเห็น notification → อนุมัติ/ปฏิเสธ)
- [ ] สร้าง UI screens

#### 7.4 Biometric Login
- [ ] Integrate `expo-local-authentication` (Fingerprint / Face ID)
- [ ] เพิ่ม biometric toggle ในหน้า settings
- [ ] ใช้ biometric แทน PIN สำหรับ login + confirm transaction

#### 7.5 PIN Change / Reset
- [ ] สร้างหน้า Change PIN (ใส่ PIN เก่า → ตั้ง PIN ใหม่)
- [ ] สร้างหน้า Reset PIN (ยืนยัน OTP → ตั้ง PIN ใหม่)
- [ ] เพิ่มเมนูใน profile/settings

#### 7.6 Static QR Code
- [ ] สร้าง permanent QR code สำหรับรับเงิน (ไม่หมดอายุ)
- [ ] แยก tab "รับเงิน" vs "จ่ายเงิน" ใน my-qr.tsx

#### 7.7 Merchant Nearby / Search
- [ ] สร้างหน้าค้นหาร้านค้าใกล้ตัว (Map view)
- [ ] Integrate location services
- [ ] แสดง merchant list + category filter

#### 7.8 Export Statement
- [ ] สร้างหน้า export statement (เลือกเดือน → ดาวน์โหลด PDF)
- [ ] Backend: generate PDF statement endpoint

---

### 8. Database — Missing Models

- [ ] `Dispute` — dispute/chargeback tracking
  ```
  model Dispute {
    id, transactionId, userId, merchantId, reason, status, 
    resolution, resolvedBy, createdAt, updatedAt
  }
  ```
- [ ] `FraudRule` — configurable fraud detection rules
  ```
  model FraudRule {
    id, name, description, ruleType, condition (JSON), 
    action, severity, isActive, createdAt, updatedAt
  }
  ```
- [ ] `Blacklist` — blocked entities
  ```
  model Blacklist {
    id, type (PHONE/IP/DEVICE/ACCOUNT), value, reason, 
    addedBy, isActive, createdAt, expiresAt
  }
  ```
- [ ] `SystemSetting` — global system configuration
  ```
  model SystemSetting {
    id, key (unique), value, description, updatedBy, updatedAt
  }
  ```
- [ ] `ApprovalRequest` — maker-checker workflow
  ```
  model ApprovalRequest {
    id, requestType, requestData (JSON), requestedBy, 
    approvedBy, status, createdAt, updatedAt
  }
  ```
- [ ] `FavoriteRecipient` — saved transfer recipients
  ```
  model FavoriteRecipient {
    id, userId, recipientPhone, recipientName, 
    nickname, createdAt
  }
  ```
- [ ] `ScheduledTransfer` — future-dated transfers
  ```
  model ScheduledTransfer {
    id, userId, recipientPhone, amount, frequency, 
    nextExecutionAt, status, createdAt
  }
  ```

---

## 🟢 Priority 2 — Nice to Have (Phase 3)

### 9. Security Hardening

- [ ] ติดตั้ง `helmet` (NestJS security headers)
- [ ] ตั้งค่า CORS policy อย่างชัดเจนใน `main.ts`
- [ ] เพิ่ม global input sanitization pipe (XSS prevention)
- [ ] เพิ่ม request logging middleware (automatic audit trail)
- [ ] ย้ายจาก `.env` files → secrets manager (AWS Secrets Manager / Vault)
- [ ] ตรวจสอบ JWT refresh token rotation implementation
- [ ] เพิ่ม CSRF protection สำหรับ admin-web
- [ ] ตรวจ SQL injection protection (Prisma ปกติป้องกันอยู่แล้ว แต่ตรวจ raw queries)

---

### 10. DevOps & Observability

- [ ] ติดตั้ง structured logging (Winston / Pino)
  - [ ] JSON format logging
  - [ ] Request ID tracking
  - [ ] Log levels per environment
- [ ] ตั้งค่า Prometheus metrics endpoint
  - [ ] HTTP request duration
  - [ ] Active connections
  - [ ] Error rates
  - [ ] Business metrics (transactions/sec, active users)
- [ ] ตั้งค่า OpenTelemetry distributed tracing
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
