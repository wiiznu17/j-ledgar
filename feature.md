# J-Ledger E-Wallet Features

This document lists all e-wallet features for the J-Ledger system, inspired by True Money Wallet (Thai e-wallet). Each feature is mapped to the responsible service with priority levels for development phase.

**Priority Levels:**

- **P0** = Critical (Must have for MVP)
- **P1** = High (Important for early adoption)
- **P2** = Medium/Low (Nice to have, can be added later)

---

## 1. Customer-Facing Features

### 1.1 Authentication & Identity

| Feature            | Description                         | Service        | Priority | Endpoints                           |
| ------------------ | ----------------------------------- | -------------- | -------- | ----------------------------------- |
| User Registration  | Register new user with phone number | portal-service | P0       | `POST /api/auth/register`           |
| OTP Verification   | Verify phone number with OTP        | portal-service | P0       | `POST /api/auth/verify-otp`         |
| User Login         | Login with phone number and PIN     | portal-service | P0       | `POST /api/auth/login`              |
| PIN Setup          | Create 6-digit PIN for transactions | portal-service | P0       | `POST /api/auth/setup-pin`          |
| PIN Change         | Change existing PIN                 | portal-service | P1       | `POST /api/auth/change-pin`         |
| PIN Reset          | Reset PIN via OTP                   | portal-service | P1       | `POST /api/auth/reset-pin`          |
| Biometric Setup    | Enable fingerprint/face recognition | portal-service | P2       | `POST /api/auth/setup-biometric`    |
| Profile Management | Update user profile (name, email)   | portal-service | P1       | `PUT /api/auth/profile`             |
| Device Management  | Manage linked devices               | portal-service | P2       | `GET/POST/DELETE /api/auth/devices` |
| Logout             | Logout from current device          | portal-service | P0       | `POST /api/auth/logout`             |
| Logout All         | Logout from all devices             | portal-service | P1       | `POST /api/auth/logout-all`         |

### 1.2 KYC & Compliance

| Feature           | Description                             | Service        | Priority | Endpoints                             |
| ----------------- | --------------------------------------- | -------------- | -------- | ------------------------------------- |
| Document Upload   | Upload ID card, passport, selfie        | portal-service | P0       | `POST /api/kyc/documents/upload`      |
| KYC Status Check  | Check current KYC verification status   | portal-service | P0       | `GET /api/kyc/status/:userId`         |
| PII Storage       | Store encrypted personal information    | portal-service | P0       | `POST /api/kyc/pii/store`             |
| PII Retrieval     | Retrieve decrypted personal information | portal-service | P1       | `GET /api/kyc/pii/get/:userId/:field` |
| PII Update        | Update personal information             | portal-service | P1       | `PUT /api/kyc/pii/update`             |
| Document List     | View uploaded documents                 | portal-service | P1       | `GET /api/kyc/documents/user/:userId` |
| Tax ID Management | Add/update tax ID for tax reporting     | portal-service | P2       | `POST/PUT /api/kyc/tax-id`            |

### 1.3 Wallet Operations

| Feature              | Description                              | Service         | Priority | Endpoints                                      |
| -------------------- | ---------------------------------------- | --------------- | -------- | ---------------------------------------------- |
| Wallet Creation      | Create wallet account for user           | finance-service | P0       | `POST /api/finance/wallets/create`             |
| Balance Inquiry      | Check wallet balance                     | finance-service | P0       | `GET /api/finance/wallets/:userId`             |
| Transaction Limits   | View daily/monthly transaction limits    | finance-service | P0       | `GET /api/finance/wallets/:userId/limits`      |
| Wallet Activation    | Activate wallet after KYC approval       | finance-service | P0       | `POST /api/finance/wallets/:userId/activate`   |
| Wallet Deactivation  | Deactivate wallet account                | finance-service | P1       | `POST /api/finance/wallets/:userId/deactivate` |
| Wallet Freeze        | Freeze wallet (admin action)             | finance-service | P1       | `POST /api/finance/wallets/:userId/freeze`     |
| Wallet Unfreeze      | Unfreeze wallet (admin action)           | finance-service | P1       | `POST /api/finance/wallets/:userId/unfreeze`   |
| Multi-Wallet Support | Support multiple wallet types (THB, USD) | finance-service | P2       | `POST /api/finance/wallets/create`             |

### 1.4 Top-Up (เติมเงิน)

| Feature              | Description                                  | Service         | Priority | Endpoints                                        |
| -------------------- | -------------------------------------------- | --------------- | -------- | ------------------------------------------------ |
| Bank Transfer Top-up | Top-up via bank transfer                     | finance-service | P0       | `POST /api/finance/wallets/topup/bank`           |
| Counter Top-up       | Top-up at convenience store (7-Eleven, etc.) | finance-service | P0       | `POST /api/finance/wallets/topup/counter`        |
| Cash Top-up          | Top-up with cash at agent                    | finance-service | P0       | `POST /api/finance/wallets/topup/cash`           |
| Card Top-up          | Top-up via debit/credit card                 | finance-service | P1       | `POST /api/finance/wallets/topup/card`           |
| Auto Top-up          | Set up automatic top-up from bank            | finance-service | P2       | `POST /api/finance/wallets/topup/auto`           |
| Top-up History       | View top-up transaction history              | finance-service | P1       | `GET /api/finance/wallets/:userId/topup-history` |

### 1.5 P2P Transfer (โอนเงิน)

| Feature               | Description                       | Service         | Priority | Endpoints                                           |
| --------------------- | --------------------------------- | --------------- | -------- | --------------------------------------------------- |
| Transfer by Phone     | Transfer money to phone number    | finance-service | P0       | `POST /api/finance/transfers/phone`                 |
| Transfer by Wallet ID | Transfer money to wallet ID       | finance-service | P0       | `POST /api/finance/transfers/wallet-id`             |
| Transfer by QR Code   | Scan QR code to transfer          | finance-service | P0       | `POST /api/finance/transfers/qr`                    |
| Transfer Request      | Request money from another user   | finance-service | P1       | `POST /api/finance/transfers/request`               |
| Transfer Schedule     | Schedule future transfer          | finance-service | P2       | `POST /api/finance/transfers/schedule`              |
| Transfer History      | View transfer transaction history | finance-service | P1       | `GET /api/finance/wallets/:userId/transfer-history` |
| Favorite Recipients   | Save frequently used recipients   | portal-service  | P1       | `GET/POST/DELETE /api/customer/favorites`           |

### 1.6 Bill Payment (จ่ายบิล)

| Feature              | Description                            | Service         | Priority | Endpoints                                     |
| -------------------- | -------------------------------------- | --------------- | -------- | --------------------------------------------- |
| Utility Bill Payment | Pay electricity, water, internet bills | finance-service | P0       | `POST /api/finance/payments/bill/utility`     |
| Credit Card Payment  | Pay credit card bills                  | finance-service | P0       | `POST /api/finance/payments/bill/credit-card` |
| Mobile Top-up        | Top-up mobile phone credit             | finance-service | P0       | `POST /api/finance/payments/bill/mobile`      |
| Government Services  | Pay government fees (tax, license)     | finance-service | P1       | `POST /api/finance/payments/bill/government`  |
| Bill Scan            | Scan bill barcode for auto-fill        | finance-service | P1       | `POST /api/finance/payments/bill/scan`        |
| Scheduled Payment    | Schedule recurring bill payment        | finance-service | P2       | `POST /api/finance/payments/bill/schedule`    |
| Bill History         | View bill payment history              | finance-service | P1       | `GET /api/finance/payments/bill/history`      |
| Saved Billers        | Save frequently used billers           | portal-service  | P1       | `GET/POST/DELETE /api/customer/bill/saved`    |

### 1.7 QR Code Payment

| Feature             | Description                            | Service         | Priority | Endpoints                               |
| ------------------- | -------------------------------------- | --------------- | -------- | --------------------------------------- |
| Generate QR Payment | Generate QR code for receiving payment | finance-service | P0       | `POST /api/finance/wallets/qr/generate` |
| Scan QR Payment     | Scan merchant QR to pay                | finance-service | P0       | `POST /api/finance/wallets/qr/pay`      |
| Static QR Code      | Generate static QR for personal use    | finance-service | P1       | `POST /api/finance/wallets/qr/static`   |
| QR Payment History  | View QR payment transactions           | finance-service | P1       | `GET /api/finance/wallets/qr/history`   |

### 1.8 Merchant Payment

| Feature          | Description                | Service         | Priority | Endpoints                                        |
| ---------------- | -------------------------- | --------------- | -------- | ------------------------------------------------ |
| Merchant List    | View nearby merchants      | portal-service  | P1       | `GET /api/customer/merchants/nearby`             |
| Merchant Search  | Search by name or category | portal-service  | P1       | `GET /api/customer/merchants/search`             |
| Merchant Payment | Pay at merchant            | finance-service | P0       | `POST /api/finance/payments/merchant`            |
| Merchant Receipt | View payment receipt       | finance-service | P1       | `GET /api/finance/payments/merchant/receipt/:id` |

### 1.9 Loyalty & Rewards

| Feature        | Description                            | Service        | Priority | Endpoints                              |
| -------------- | -------------------------------------- | -------------- | -------- | -------------------------------------- |
| Points Balance | View loyalty points balance            | portal-service | P2       | `GET /api/customer/loyalty/points`     |
| Points History | View points earning/redemption history | portal-service | P2       | `GET /api/customer/loyalty/history`    |
| Redeem Rewards | Redeem points for rewards              | portal-service | P2       | `POST /api/customer/loyalty/redeem`    |
| Promotions     | View available promotions              | portal-service | P2       | `GET /api/customer/loyalty/promotions` |

### 1.10 Transaction Management

| Feature             | Description                               | Service         | Priority | Endpoints                                              |
| ------------------- | ----------------------------------------- | --------------- | -------- | ------------------------------------------------------ |
| Transaction History | View all transaction history              | finance-service | P0       | `GET /api/finance/wallets/:userId/transactions`        |
| Transaction Details | View transaction details                  | finance-service | P0       | `GET /api/finance/transactions/:id`                    |
| Transaction Search  | Search transactions by date, type, amount | finance-service | P1       | `GET /api/finance/wallets/:userId/transactions/search` |
| Transaction Receipt | Download transaction receipt              | finance-service | P1       | `GET /api/finance/transactions/:id/receipt`            |
| Export Statement    | Export monthly statement (PDF)            | finance-service | P2       | `GET /api/finance/wallets/:userId/statement`           |

### 1.11 Notifications

| Feature               | Description                           | Service             | Priority | Endpoints                         |
| --------------------- | ------------------------------------- | ------------------- | -------- | --------------------------------- |
| Transaction Alert     | Push notification for transactions    | notification-worker | P0       | -                                 |
| Security Alert        | Push notification for security events | notification-worker | P0       | -                                 |
| Promotion Alert       | Push notification for promotions      | notification-worker | P2       | -                                 |
| Notification Settings | Manage notification preferences       | portal-service      | P1       | `GET/PUT /api/auth/notifications` |
| Notification History  | View notification history             | portal-service      | P1       | `GET /api/notifications/history`  |

---

## 2. Admin-Facing Features

### 2.1 Staff Management

| Feature            | Description                  | Service        | Priority | Endpoints                              |
| ------------------ | ---------------------------- | -------------- | -------- | -------------------------------------- |
| Staff Registration | Create new staff account     | portal-service | P0       | `POST /api/admin/staff`                |
| Staff Login        | Staff login with credentials | portal-service | P0       | `POST /api/admin/auth/login`           |
| Staff Profile      | View/update staff profile    | portal-service | P0       | `GET/PUT /api/admin/staff/:id`         |
| Staff List         | View all staff accounts      | portal-service | P0       | `GET /api/admin/staff`                 |
| Staff Deactivation | Deactivate staff account     | portal-service | P1       | `POST /api/admin/staff/:id/deactivate` |
| Staff Reactivation | Reactivate staff account     | portal-service | P1       | `POST /api/admin/staff/:id/reactivate` |

### 2.2 Role & Permission Management

| Feature                | Description                   | Service        | Priority | Endpoints                                   |
| ---------------------- | ----------------------------- | -------------- | -------- | ------------------------------------------- |
| Role Creation          | Create new role               | portal-service | P0       | `POST /api/admin/roles`                     |
| Role List              | View all roles                | portal-service | P0       | `GET /api/admin/roles`                      |
| Role Update            | Update role permissions       | portal-service | P0       | `PUT /api/admin/roles/:id`                  |
| Role Deletion          | Delete role                   | portal-service | P1       | `DELETE /api/admin/roles/:id`               |
| Permission List        | View all permissions          | portal-service | P0       | `GET /api/admin/permissions`                |
| Assign Role to Staff   | Assign role to staff member   | portal-service | P0       | `POST /api/admin/staff/:id/roles`           |
| Remove Role from Staff | Remove role from staff member | portal-service | P0       | `DELETE /api/admin/staff/:id/roles/:roleId` |

### 2.3 User Management

| Feature               | Description                                   | Service        | Priority | Endpoints                           |
| --------------------- | --------------------------------------------- | -------------- | -------- | ----------------------------------- |
| User Search           | Search users by phone, name, wallet ID        | portal-service | P0       | `GET /api/admin/users/search`       |
| User Details          | View user details and profile                 | portal-service | P0       | `GET /api/admin/users/:id`          |
| User List             | View all users with pagination                | portal-service | P0       | `GET /api/admin/users`              |
| Account Status Change | Change user account status (active/suspended) | portal-service | P0       | `PUT /api/admin/users/:id/status`   |
| User Notes            | Add notes to user account                     | portal-service | P1       | `POST /api/admin/users/:id/notes`   |
| User Activity Log     | View user activity history                    | portal-service | P1       | `GET /api/admin/users/:id/activity` |

### 2.4 KYC Management

| Feature             | Description                        | Service        | Priority | Endpoints                                 |
| ------------------- | ---------------------------------- | -------------- | -------- | ----------------------------------------- |
| Pending KYC List    | View pending KYC approvals         | portal-service | P0       | `GET /api/admin/kyc/pending`              |
| KYC Document Review | Review uploaded documents          | portal-service | P0       | `GET /api/admin/kyc/documents/:id`        |
| KYC Approval        | Approve KYC application            | portal-service | P0       | `POST /api/admin/kyc/approve/:documentId` |
| KYC Rejection       | Reject KYC application with reason | portal-service | P0       | `POST /api/admin/kyc/reject/:documentId`  |
| KYC History         | View KYC history for user          | portal-service | P1       | `GET /api/admin/kyc/history/:userId`      |
| PII Access          | Access user PII (with audit log)   | portal-service | P0       | `GET /api/admin/kyc/pii/:userId`          |

### 2.5 Transaction Monitoring

| Feature                     | Description                        | Service        | Priority | Endpoints                                  |
| --------------------------- | ---------------------------------- | -------------- | -------- | ------------------------------------------ |
| Transaction List            | View all transactions              | portal-service | P0       | `GET /api/admin/transactions`              |
| Transaction Search          | Search transactions by filters     | portal-service | P0       | `GET /api/admin/transactions/search`       |
| Transaction Details         | View transaction details           | portal-service | P0       | `GET /api/admin/transactions/:id`          |
| Flag Suspicious Transaction | Flag transaction for review        | portal-service | P0       | `POST /api/admin/transactions/:id/flag`    |
| Reverse Transaction         | Reverse transaction (admin action) | portal-service | P1       | `POST /api/admin/transactions/:id/reverse` |
| High Value Alerts           | View high-value transaction alerts | portal-service | P1       | `GET /api/admin/transactions/high-value`   |

### 2.6 Fraud Detection

| Feature                  | Description                        | Service        | Priority | Endpoints                             |
| ------------------------ | ---------------------------------- | -------------- | -------- | ------------------------------------- |
| Fraud Rules Management   | Manage fraud detection rules       | portal-service | P1       | `GET/POST/PUT /api/admin/fraud/rules` |
| Suspicious Activity List | View flagged suspicious activities | portal-service | P1       | `GET /api/admin/fraud/suspicious`     |
| Block User               | Block user due to fraud            | portal-service | P0       | `POST /api/admin/users/:id/block`     |
| Unblock User             | Unblock user                       | portal-service | P0       | `POST /api/admin/users/:id/unblock`   |
| Fraud Report             | Generate fraud detection report    | portal-service | P2       | `GET /api/admin/fraud/report`         |

### 2.7 Wallet Management

| Feature                   | Description                          | Service        | Priority | Endpoints                                |
| ------------------------- | ------------------------------------ | -------------- | -------- | ---------------------------------------- |
| Wallet List               | View all wallets                     | portal-service | P0       | `GET /api/admin/wallets`                 |
| Wallet Details            | View wallet details                  | portal-service | P0       | `GET /api/admin/wallets/:id`             |
| Wallet Balance Adjustment | Adjust wallet balance (credit/debit) | portal-service | P0       | `POST /api/admin/wallets/:id/adjust`     |
| Wallet Deactivation       | Deactivate wallet account            | portal-service | P0       | `POST /api/admin/wallets/:id/deactivate` |
| Wallet Activation         | Activate wallet account              | portal-service | P0       | `POST /api/admin/wallets/:id/activate`   |
| Wallet Limits Management  | Set transaction limits for wallet    | portal-service | P1       | `PUT /api/admin/wallets/:id/limits`      |

### 2.8 Reports & Analytics

| Feature                    | Description                          | Service        | Priority | Endpoints                             |
| -------------------------- | ------------------------------------ | -------------- | -------- | ------------------------------------- |
| Daily Transaction Report   | Generate daily transaction report    | portal-service | P0       | `GET /api/admin/reports/daily`        |
| Monthly Transaction Report | Generate monthly transaction report  | portal-service | P0       | `GET /api/admin/reports/monthly`      |
| User Statistics            | View user growth statistics          | portal-service | P0       | `GET /api/admin/reports/users`        |
| Revenue Report             | Generate revenue report              | portal-service | P1       | `GET /api/admin/reports/revenue`      |
| Top-up Report              | Generate top-up statistics           | portal-service | P1       | `GET /api/admin/reports/topup`        |
| Bill Payment Report        | Generate bill payment statistics     | portal-service | P1       | `GET /api/admin/reports/bill-payment` |
| Merchant Report            | Generate merchant transaction report | portal-service | P2       | `GET /api/admin/reports/merchant`     |
| Custom Report              | Generate custom report with filters  | portal-service | P2       | `POST /api/admin/reports/custom`      |

### 2.9 System Configuration

| Feature             | Description                     | Service        | Priority | Endpoints                            |
| ------------------- | ------------------------------- | -------------- | -------- | ------------------------------------ |
| System Settings     | View/update system settings     | portal-service | P0       | `GET/PUT /api/admin/settings`        |
| Fee Configuration   | Configure transaction fees      | portal-service | P0       | `GET/PUT /api/admin/settings/fees`   |
| Limit Configuration | Configure system-wide limits    | portal-service | P0       | `GET/PUT /api/admin/settings/limits` |
| Maintenance Mode    | Enable/disable maintenance mode | portal-service | P0       | `POST /api/admin/system/maintenance` |
| System Health       | View system health status       | portal-service | P0       | `GET /api/admin/system/health`       |

### 2.10 Audit Logs

| Feature            | Description                  | Service        | Priority | Endpoints                          |
| ------------------ | ---------------------------- | -------------- | -------- | ---------------------------------- |
| Audit Log List     | View system audit logs       | portal-service | P0       | `GET /api/admin/audit-logs`        |
| Audit Log Search   | Search audit logs by filters | portal-service | P0       | `GET /api/admin/audit-logs/search` |
| Staff Activity Log | View staff activity history  | portal-service | P0       | `GET /api/admin/audit-logs/staff`  |
| Export Audit Logs  | Export audit logs (CSV)      | portal-service | P1       | `GET /api/admin/audit-logs/export` |

---

## 3. Infrastructure Features

### 3.1 Message Queue

| Feature           | Description                | Service | Priority | Endpoints |
| ----------------- | -------------------------- | ------- | -------- | --------- |
| Event Publishing  | Publish events to Kafka    | kafka   | P0       | -         |
| Event Consumption | Consume events from Kafka  | kafka   | P0       | -         |
| Dead Letter Queue | Handle failed events       | kafka   | P1       | -         |
| Event Replay      | Replay events for recovery | kafka   | P2       | -         |

### 3.2 Caching

| Feature            | Description                     | Service | Priority | Endpoints |
| ------------------ | ------------------------------- | ------- | -------- | --------- |
| Session Cache      | Cache user sessions             | redis   | P0       | -         |
| Data Cache         | Cache frequently accessed data  | redis   | P1       | -         |
| Cache Invalidation | Invalidate cache on data change | redis   | P1       | -         |

### 3.3 Database

| Feature            | Description                   | Service  | Priority | Endpoints |
| ------------------ | ----------------------------- | -------- | -------- | --------- |
| Schema Migration   | Database schema migrations    | postgres | P0       | -         |
| Connection Pooling | Database connection pooling   | postgres | P0       | -         |
| Backup/Restore     | Database backup and restore   | postgres | P0       | -         |
| Replication        | Database replication (future) | postgres | P2       | -         |

### 3.7 Monitoring & Logging

| Feature                | Description                     | Service      | Priority | Endpoints |
| ---------------------- | ------------------------------- | ------------ | -------- | --------- |
| Application Logging    | Structured application logging  | All services | P0       | -         |
| Log Aggregation        | Centralized log aggregation     | -            | P1       | -         |
| Metrics Collection     | Collect application metrics     | All services | P0       | -         |
| Performance Monitoring | Monitor application performance | -            | P1       | -         |
| Alerting               | Alert on system anomalies       | -            | P1       | -         |

### 3.8 CI/CD

| Feature               | Description                  | Service | Priority | Endpoints |
| --------------------- | ---------------------------- | ------- | -------- | --------- |
| Automated Testing     | Run automated tests on build | -       | P0       | -         |
| Automated Deployment  | Deploy to staging/production | -       | P0       | -         |
| Rollback Capability   | Rollback to previous version | -       | P0       | -         |
| Blue-Green Deployment | Zero-downtime deployment     | -       | P2       | -         |

---

## Service Summary

| Service                  | Port      | Primary Responsibilities                    |
| ------------------------ | --------- | ------------------------------------------- |
| **auth-service**         | 3003      | Customer authentication, profile management |
| **admin-auth-service**   | 3005      | Staff authentication, RBAC                  |
| **user-kyc-service**     | 3004      | KYC verification, PII management            |
| **wallet-service**       | 8082      | Wallet operations, transactions             |
| **wallet-api**           | 3002      | Customer BFF (aggregates services)          |
| **admin-api**            | 3001      | Admin BFF (aggregates services)             |
| **core-service**         | 8081      | Ledger engine, double-entry accounting      |
| **notification-service** | -         | Kafka consumer, push notifications          |
| **api-gateway**          | 8080      | Edge gateway, routing, JWT validation       |
| **eureka-server**        | 8761      | Service discovery registry                  |
| **internal-nginx**       | 8081/8443 | Admin access control (VPN)                  |
| **public-nginx**         | 80/443    | Public access, WAF                          |

---

## Development Priority Roadmap

### Phase 1 (P0 - MVP)

- Authentication & Identity (auth-service)
- KYC & Compliance (user-kyc-service)
- Wallet Operations (wallet-service)
- Top-up (wallet-service)
- P2P Transfer (wallet-service)
- Bill Payment (wallet-service)
- QR Code Payment (wallet-service)
- Staff Management (admin-auth-service)
- Role & Permission Management (admin-auth-service)
- User Management (admin-api)
- KYC Management (admin-api)
- Transaction Monitoring (admin-api)
- Infrastructure (API Gateway, Eureka, Redis, Kafka)

### Phase 2 (P1 - Early Adoption)

- PIN Change/Reset (auth-service)
- Profile Management (auth-service)
- PII Update (user-kyc-service)
- Card Top-up (wallet-service)
- Transfer Request (wallet-service)
- Scheduled Payment (wallet-service)
- Cash Card Redemption (wallet-service)
- Merchant Payment (wallet-service)
- Transaction Search (wallet-service)
- Loyalty Points (wallet-service)
- Staff Deactivation (admin-auth-service)
- Fraud Detection (admin-api)
- Reports & Analytics (admin-api)
- System Configuration (admin-api)
- Circuit Breaker (api-gateway)
- Monitoring & Logging

### Phase 3 (P2 - Growth)

- Biometric Setup (auth-service)
- Device Management (auth-service)
- Multi-Wallet Support (wallet-service)
- Auto Top-up (wallet-service)
- Transfer Schedule (wallet-service)
- Government Services (wallet-service)
- Static QR Code (wallet-service)
- Promotions (wallet-service)
- Merchant List (wallet-service)
- Export Statement (wallet-service)
- Role Deletion (admin-auth-service)
- Custom Reports (admin-api)
- Database Replication (postgres)
- Blue-Green Deployment (CI/CD)
