# J-Ledger Database Diagram (Complete Master v1.8.4)

เอกสารนี้รวบรวมโครงสร้างฐานข้อมูลแบบ **สมบูรณ์ 100%** ครบถ้วนทุกตารางและคอลัมน์ แบ่งตาม 8 Physical Schemas

---

## 🏛️ 1. Finance Schema (`finance`)
จัดเก็บข้อมูลการเงินและระบบตรวจสอบ (Double-Entry Accounting) - *Managed by finance-service*

<details open>
<summary><b>ขยายดูรายละเอียด Finance Schema (14 Tables)</b></summary>

[🔍 Open in Full Screen (Zoomable)](https://mermaid.live/edit#pako:eNptksFuwyAMhl_F8nmX9gDNoUonrVInDbtMvSAXmkhREpAsq_bdZ9pUu20nI-z_N7Y_G8NoVSRGZ3X_YjX3W0uL270mRlsjR8G_XN0v3-7uF09Pe0NcNkaOg3v89nh7tT_tH_YvHsc7M0fBkZ264e1_e_76vH_Yv7kfN_ZWhSOf2qHz_3OOf8u9mNqBf26HyrU_8T_m38p24B97G_CHHn_vH_L6_vYn8O8O51WOn9v_1x_p6-90_N9V6T9VpU9Y-Q_m6T-Yh6_P-Vn9_Kx-fFY_P6sfntWPz-r_AK-Nf1w)

```mermaid
erDiagram
    wallets ||--o{ transactions : "from/to"
    wallets ||--|| reward_accounts : "linked"
    accounts ||--o{ internal_ledger_entries : "audit trail"
    accounts ||--o{ payment_transactions : "syncs"
    accounts ||--o{ transaction_limits : "limits"
    
    wallets {
        bigint id PK
        varchar user_id UK "Logical Link: identity.User"
        varchar wallet_id UK "Public ID"
        decimal balance "19,4"
        varchar currency
        varchar status
        decimal daily_limit
        decimal monthly_limit
        integer version
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        bigint id PK
        varchar transaction_id UK
        bigint from_wallet_id FK
        bigint to_wallet_id FK
        varchar type
        decimal amount
        decimal fee
        varchar status
        text description
        jsonb metadata
        timestamp created_at
        timestamp completed_at
    }

    accounts {
        uuid id PK
        uuid user_id FK
        varchar account_name
        decimal balance "20,4"
        varchar status
        varchar kyc_status
        timestamp kyc_review_date
        integer version
        timestamp created_at
        timestamp updated_at
    }

    internal_ledger_entries {
        uuid id PK
        uuid account_id FK
        varchar entry_type "DEBIT, CREDIT"
        decimal amount "20,4"
        timestamp created_at
    }

    payment_transactions {
        uuid id PK
        uuid account_id FK
        varchar reference_id UK
        varchar type
        decimal amount
        varchar status
        timestamp created_at
    }

    transaction_limits {
        uuid id PK
        uuid account_id FK
        varchar limit_type
        decimal limit_amount
        decimal current_amount
        timestamp reset_date
        boolean is_active
        timestamp created_at
    }

    reward_accounts {
        uuid account_id PK "Ref accounts.id"
        decimal points_balance
        timestamp updated_at
    }

    linked_bank_accounts {
        bigint id PK
        varchar user_id "Ref identity.User"
        varchar bank_code
        varchar account_number
        boolean is_default
        boolean is_verified
        timestamp created_at
    }

    suspicious_activities {
        uuid id PK
        uuid user_id "Ref identity.User"
        uuid transfer_id
        varchar activity_type
        varchar status
        decimal amount
        integer risk_score
        timestamp reviewed_at
    }

    integration_outbox {
        uuid id PK
        varchar event_type
        jsonb payload
        varchar status
        integer retry_count
        timestamp created_at
    }

    reconciliation_reports {
        uuid id PK
        date report_date UK
        decimal total_system_assets
        decimal total_user_liabilities
        decimal discrepancy
        varchar status
    }

    system_settings {
        bigint id PK
        varchar system_name
        decimal transfer_fee_fixed
        decimal daily_transaction_limit
        boolean kyc_required
    }

    ledger_entries_LEGACY {
        bigint id PK
        bigint wallet_id
        decimal amount
        decimal balance_after
    }

    transaction_holds_LEGACY {
        bigint id PK
        bigint wallet_id
        decimal amount
        timestamp expires_at
        varchar status
    }
```
</details>

---

## 🏛️ 2. Identity Schema (`identity`)
จัดการข้อมูลผู้ใช้งานและระบบความปลอดภัย (10 Tables)

<details open>
<summary><b>ขยายดูรายละเอียด Identity Schema</b></summary>

```mermaid
erDiagram
    User ||--o{ UserDevice : "registers"
    User ||--o{ RefreshSession : "manages"
    User ||--o{ OtpChallenge : "requests"
    User ||--o{ UserConsent : "gives"
    User ||--o{ SecurityEvent : "triggers"
    User ||--o{ UserSetting : "configures"
    User ||--o{ Notification : "receives"
    User ||--|| NotificationPreference : "sets"
    User ||--o{ Address : "uses"

    User {
        string id PK
        string phone_number UK
        string email UK
        string passwordHash
        string pinHash
        string biometricKey
        UserStatus status
        RegistrationState registration_state
        integer pinAttempts
        datetime pinLockedUntil
        string ledgerAccountId
        datetime createdAt
        datetime updatedAt
    }

    UserDevice {
        string id PK
        string userId FK
        string deviceIdentifier UK
        string deviceName
        string deviceType
        string osVersion
        string appVersion
        DeviceTrustLevel trustLevel
        string pushToken
        datetime lastSeenAt
        datetime createdAt
        datetime updatedAt
    }

    RefreshSession {
        string id PK
        string userId FK
        string deviceId
        string tokenHash
        datetime expiresAt
        datetime revokedAt
        string deviceType
        string ipAddress
        string userAgent
        string location
        datetime lastSeenAt
        datetime createdAt
    }

    OtpChallenge {
        string id PK
        string userId FK
        string phoneNumber "Indexed"
        string code
        integer attempts
        datetime expiresAt
        datetime verifiedAt
        datetime createdAt
    }

    UserConsent {
        string id PK
        string userId FK
        ConsentType consentType UK
        datetime acceptedAt
        datetime withdrawnAt
        string ipAddress
        string userAgent
    }

    SecurityEvent {
        string id PK
        string userId FK
        SecurityEventType eventType
        string ipAddress
        string userAgent
        json metadata
        datetime createdAt
    }

    UserSetting {
        string id PK
        string userId FK
        string key UK
        string value
        datetime createdAt
        datetime updatedAt
    }

    Notification {
        string id PK
        string userId FK
        string title
        string message
        string type
        string category
        boolean isRead
        string idempotencyKey UK
        string referenceId
        string path
        json metadata
        datetime createdAt
        datetime updatedAt
    }

    NotificationPreference {
        string userId PK
        boolean pushEnabled
        boolean emailEnabled
        boolean securityForceEmail
    }

    Address {
        string id PK
        string userId FK
        AddressType type
        string label
        string line1
        string line2
        string subdistrict
        string district
        string province
        string postalCode
        string countryCode "default: TH"
        boolean isVerified
        datetime verifiedAt
        AddressVerificationSource verificationSource
        string documentRef
        datetime deletedAt
        datetime createdAt
        datetime updatedAt
    }
```
</details>

---

## 🏛️ 3. KYC Schema (`kyc`)
ระบบการตรวจสอบและยืนยันตัวตน (3 Tables)

<details open>
<summary><b>ขยายดูรายละเอียด KYC Schema</b></summary>

```mermaid
erDiagram
    KYCData ||--o{ KYCDocument : "provides"

    KYCData {
        string id PK
        string userId UK "Ref: identity.User"
        string idCardNumberEncrypted
        string idCardName
        string prefix
        string firstNameTh
        string lastNameTh
        string prefixEn
        string firstNameEn
        string lastNameEn
        datetime dateOfBirth
        string thaiNameEncrypted
        string idCardToken UK
        string idCardImageUrl
        string idCardImageSha256
        string selfieImageUrl
        string selfieImageSha256
        string livenessSessionId
        integer faceMatchScore
        datetime idCardIssueDate
        datetime idCardExpiryDate
        string religion
        string reviewNote
        float ocrConfidence
        KYCVerificationStatus verificationStatus
        datetime verifiedAt
        datetime createdAt
        datetime updatedAt
    }

    KYCDocument {
        string id PK
        string userId "Ref: identity.User"
        string documentType
        string s3Key
        string s3Url
        json metadata
        KYCDocumentStatus status
        datetime createdAt
        datetime updatedAt
    }

    PII {
        string id PK
        string userId FK "Ref: identity.User"
        string field PK "e.g. phone, email"
        string encryptedData
        datetime createdAt
        datetime updatedAt
    }
```
</details>

---

## 🏛️ 4. Admin Schema (`admin`)
ระบบจัดการหลังบ้านและการกำหนดสิทธิ์ (5 Tables)

<details open>
<summary><b>ขยายดูรายละเอียด Admin Schema</b></summary>

```mermaid
erDiagram
    Staff ||--o{ StaffRole : "has roles"
    Role ||--o{ StaffRole : "assigned to"
    Role ||--o{ RolePermission : "has permissions"
    Permission ||--o{ RolePermission : "defined in"

    Staff {
        string id PK
        string username UK
        string email UK
        string password
        string firstName
        string lastName
        boolean isActive
        string refreshTokenHash
        string resetToken UK
        datetime resetTokenExpiry
        datetime createdAt
        datetime updatedAt
    }

    Role {
        string id PK
        string name UK
        string description
        boolean isSystem
        datetime createdAt
        datetime updatedAt
    }

    Permission {
        string id PK
        string name UK
        string description
        string resource
        string action
        datetime createdAt
        datetime updatedAt
    }

    StaffRole {
        string id PK
        string staffId FK
        string roleId FK
        datetime createdAt
    }

    RolePermission {
        string id PK
        string roleId FK
        string permissionId FK
        datetime createdAt
    }
```
</details>

---

## 🏛️ 5. Integration Schema (`integration`)
การเชื่อมต่อธนาคาร ร้านค้า และรายการเติมเงิน (3 Tables)

<details open>
<summary><b>ขยายดูรายละเอียด Integration Schema</b></summary>

```mermaid
erDiagram
    TopupOrder {
        string id PK
        string userId "Ref: identity.User"
        decimal amount "19,4"
        string currency "default: THB"
        TopupOrderStatus status
        string stripePaymentIntentId UK
        string clientSecretRef
        string idempotencyKey UK
        string financeTransactionId "Ref: finance.transactions"
        string processedEventId
        datetime createdAt
        datetime updatedAt
    }

    BankIntegration {
        bigint id PK
        string bankCode
        string bankName
        string apiKey
        BankStatus status
        datetime createdAt
        datetime updatedAt
    }

    Merchant {
        bigint id PK
        string merchantId UK
        string name
        string category
        MerchantStatus status
        datetime createdAt
        datetime updatedAt
    }
```
</details>

---

## 🏛️ 6. Loyalty Schema (`loyalty`)
ระบบแต้มสะสมและสิทธิประโยชน์ (7 Tables)

<details open>
<summary><b>ขยายดูรายละเอียด Loyalty Schema</b></summary>

```mermaid
erDiagram
    Brand ||--o{ Deal : "provides"
    DealCategory ||--o{ Deal : "categorizes"
    Deal ||--o{ DealRedemption : "redeemed as"

    UserPoint {
        string id PK
        string userId UK "Ref: identity.User"
        integer balance
        integer lifetimePoints
        datetime updatedAt
    }

    PointHistory {
        string id PK
        string userId "Ref: identity.User"
        integer amount
        PointTransactionType type
        string description
        string referenceId
        datetime expiresAt
        datetime createdAt
    }

    Brand {
        string id PK
        string name UK
        string logoUrl
        string description
        string website
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    DealCategory {
        string id PK
        string name UK
        string description
        string iconUrl
        integer order
    }

    Deal {
        string id PK
        string brandId FK
        string categoryId FK
        string title
        string description
        string termsCondition
        integer pointsRequired
        string imageUrl
        integer stock
        integer remainingStock
        integer limitPerUser
        integer priority
        boolean isActive
        datetime startDate
        datetime endDate
        string actionPath
        datetime createdAt
        datetime updatedAt
    }

    DealRedemption {
        string id PK
        string dealId FK
        string userId "Ref: identity.User"
        integer pointsSpent
        string redemptionCode UK
        RedemptionStatus status
        datetime expiresAt
        datetime usedAt
        datetime createdAt
        datetime updatedAt
    }

    Banner {
        string id PK
        string title
        string imageUrl
        string actionPath
        integer priority
        boolean isActive
        datetime startDate
        datetime endDate
        datetime createdAt
        datetime updatedAt
    }
```
</details>

---

## 🏛️ 7. Billing Schema (`billing`)
ระบบใบแจ้งหนี้และการเรียกเก็บเงิน (2 Tables)

<details open>
<summary><b>ขยายดูรายละเอียด Billing Schema</b></summary>

```mermaid
erDiagram
    Invoice ||--o{ InvoiceItem : "contains"

    Invoice {
        string id PK
        string invoiceNumber UK
        string userId "Ref: identity.User"
        string senderName
        string senderDetail
        decimal amount "19,4"
        decimal tax "19,4"
        decimal total "19,4"
        string currency "THB"
        InvoiceStatus status
        datetime dueDate
        datetime paidAt
        string referenceId
        string note
        datetime createdAt
        datetime updatedAt
    }

    InvoiceItem {
        string id PK
        string invoiceId FK
        string name
        integer quantity
        decimal unitPrice "19,4"
        decimal amount "19,4"
    }
```
</details>

---

## 🏛️ 8. Audit & Reporting Schemas (`audit`, `reporting`)
ประวัติการทำงานและการสร้างรายงาน (2 Tables)

<details open>
<summary><b>ขยายดูรายละเอียด Audit & Reporting</b></summary>

```mermaid
erDiagram
    AuditLog {
        string id PK
        string adminUserId "Ref: admin.Staff"
        string userId "Ref: identity.User"
        string action
        string resourceType
        string resourceId
        string ipAddress
        string userAgent
        json requestPayload
        integer responseStatus
        json changes
        string reason
        datetime createdAt "Indexed"
    }

    Report {
        bigint id PK
        string reportType
        json parameters
        string fileUrl
        string generatedBy "Ref: admin.Staff"
        ReportStatus status
        datetime completedAt
        datetime createdAt
    }
```
</details>

---

## 🧩 Enums & Shared States (Logical Definition)
ข้อมูลชุดที่ใช้ร่วมกันในระดับ Application Logic (Total: 16 Enums)

- **UserStatus:** `PENDING_APPROVAL`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `REJECTED`
- **RegistrationState:** `PENDING`, `OTP_VERIFIED`, `KYC_VERIFIED`, `COMPLETED`
- **PointTransactionType:** `EARN`, `REDEEM`, `EXPIRE`, `ADJUSTMENT`
- **RedemptionStatus:** `REDEEMED`, `USED`, `EXPIRED`, `CANCELED`
- **BankStatus:** `ACTIVE`, `INACTIVE`, `MAINTENANCE`
- **MerchantStatus:** `ACTIVE`, `INACTIVE`, `PENDING`
- **InvoiceStatus:** `PENDING`, `PAID`, `CANCELLED`, `OVERDUE`
- **ReportStatus:** `GENERATING`, `COMPLETED`, `FAILED`
- **AddressType:** `HOME`, `OFFICE`, `CURRENT`, `ID_CARD`
- **AddressVerificationSource:** `MANUAL`, `DOPA`, `UTILITY_BILL`
- **ConsentType:** `TERMS_AND_CONDITIONS`, `PRIVACY_POLICY`, `MARKETING`
- **DeviceTrustLevel:** `UNKNOWN`, `TRUSTED`, `UNTRUSTED`, `BLOCKED`
- **KYCDocumentStatus:** `PENDING`, `APPROVED`, `REJECTED`
- **KYCVerificationStatus:** `PENDING`, `VERIFIED`, `REJECTED`
- **SecurityEventType:** `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`, `PIN_RESET`
- **TopupOrderStatus:** `PENDING`, `SUCCESS`, `FAILED`

---

> [!TIP]
> **Schema Isolation:** แต่ละ Diagram จะแสดงเฉพาะตารางที่เป็นเจ้าของ (Owner) เท่านั้น สำหรับความสัมพันธ์ข้าม Schema จะถูกระบุไว้ในคำอธิบายคอลัมน์ (เช่น `Ref: identity.User`) เพื่อรักษาความเป็นอิสระของแต่ละโมดูลตามหลักการ Microservices
