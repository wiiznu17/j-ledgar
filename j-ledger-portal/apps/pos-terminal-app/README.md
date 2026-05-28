# 🏦 J-Ledger POS: Smart Android Terminal Client 💳

> **ซอฟต์แวร์เครื่องรับชำระเงินอัจฉริยะระบบ Android (Smart POS Terminal)**
> โปรเจกต์นี้จะติดตั้งอยู่บนฮาร์ดแวร์เครื่องรูดบัตรอัจฉริยะ (เช่นเครื่องแบรนด์ PAX หรือ Verifone) ทำหน้าที่เป็นจุดรับชำระเงินและใช้สิทธิ์ Deal ของร้านค้า (In-Store Payment & Deal Redemption Terminal) เชื่อมต่อ API Gateway หลังบ้านอย่างปลอดภัยด้วยลายเซ็นดิจิทัล HMAC SHA-256 พร้อม Nonce ป้องกัน Replay Attack และสั่งพิมพ์ใบเสร็จผ่านระบบบัสภายในระบบปฏิบัติการ Android (IPC via AIDL)

---

## 🎨 1. สถาปัตยกรรมระบบ (System Architecture)

แอป POS นี้จะทำงานแยกโปรเซสออกจากอุปกรณ์พิมพ์ใบเสร็จภายในตัวเครื่อง โดยใช้สถาปัตยกรรม **Clean Architecture + MVVM** และทำระบบความปลอดภัยที่อุปกรณ์ (Device-Level Security) ก่อนส่งธุรกรรมเข้าสู่ระบบคลาวด์ J-Ledger:

```
[ J-Ledger POS Application (Process A) ]
         │
         ├──► [ Presentation Layer ] (Jetpack Compose UI)
         │         ├── PaymentScreen (Numpad + ยอดเงิน)
         │         ├── ScannerScreen (CameraX QR Scanner)
         │         ├── DealRedemptionScreen (สแกน/กรอก Deal Code)
         │         └── DealPreviewScreen (Preview + Confirm Use)
         │
         ├──► [ Domain Layer ] (Use Cases & Business Logic)
         └──► [ Data Layer ] (Retrofit API Client & Secure Store)
                  │
                  ├───► [ Android Keystore ] (เก็บกุญแจลับระดับฮาร์ดแวร์)
                  │
                  ├───► [ HMAC-SHA256 Interceptor ] ── Headers: ──►
                  │       X-JLedger-Terminal-Id
                  │       X-JLedger-Signature (hex)
                  │       X-JLedger-Timestamp (epoch seconds)
                  │       X-JLedger-Nonce (unique per request)
                  │
                  ├───► [ IPC: AIDL Inter-Process ] (ส่งคำขอพิมพ์ข้ามโปรเซส)
                  │          │
                  │          ▼
                  │     [ Thermal Printer Driver Service (Process B) ] ──► (Thermal Printer Hardware)
                  │
                  └───► [ API Gateway ] (NestJS Portal Service) ──► [ Core Spring Boot Ledger ]
```

---

## 🛠️ 2. กองเทคโนโลยีที่ใช้ (Tech Stack)

*   **Language:** Kotlin (100%) พร้อมใช้ Kotlin Coroutines & Flow สำหรับการทำงานแบบอะซิงโครนัส
*   **UI Framework:** Jetpack Compose (สไตล์ดีไซน์ Material 3 ทันสมัย รองรับ Dark Theme)
*   **Networking:** Retrofit 2 + OkHttp 4 (มี Interceptor คำนวณความปลอดภัย)
*   **Security:** Android Keystore API (เก็บ Secret Key ใน Secure Hardware (TEE/SE)) + Rootbeer (ทำ Root Detection)
*   **Hardware Integration:** Android Interface Definition Language (AIDL) สำหรับคุยกับไดรเวอร์เครื่องพิมพ์ความร้อน
*   **QR Scanner:** Google ML Kit Barcode Scanning + CameraX Jetpack Component

---

## 📡 3. API Endpoints ที่เชื่อมต่อ (Backend API Contract)

### Authentication
ทุก Request ต้องมี 4 headers:

| Header | Description |
|---|---|
| `X-JLedger-Terminal-Id` | Terminal UUID |
| `X-JLedger-Signature` | HMAC-SHA256 hex signature |
| `X-JLedger-Timestamp` | Unix epoch seconds |
| `X-JLedger-Nonce` | Unique random string (single-use) |

**Signature Formula:**
```
message = "${METHOD}:${path}:${timestamp}:${nonce}"
signature = HMAC-SHA256(message, secretKey) → hex
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/terminal/payment` | POS Payment (ตัดเงินลูกค้า) |
| `POST` | `/api/v1/terminal/loyalty/redeem` | Loyalty Points Redemption |
| `GET` | `/api/merchant/deals/redemptions/:code/verify` | Preview Deal ก่อนยืนยัน |
| `POST` | `/api/merchant/deals/redemptions/:code/use` | ยืนยันใช้ Deal Code |

---

## 🚀 4. แผนงานการพัฒนา (Development Roadmap)

| Phase | ชื่อ | สถานะ |
|---|---|---|
| 1 | 🔒 Secure Device Provisioning (ลงทะเบียนเครื่อง + เก็บคีย์ลับ) | 📋 Planned |
| 2 | 🔑 HMAC-SHA256 + Nonce Interceptor (ระบบเซ็นลายเซ็น) | 📋 Planned |
| 3 | 📷 CameraX QR Scanner + POS Payment (รับชำระเงิน) | 📋 Planned |
| 4 | 🎁 Deal Redemption Flow (Verify → Use 2 ขั้นตอน) | 📋 Planned |
| 5 | 🖨️ Thermal Printer via AIDL (พิมพ์ใบเสร็จ) | 📋 Planned |

> 📖 ดูรายละเอียดเชิงลึกของแต่ละ Phase ได้ที่ [PLAN.md](./PLAN.md)

---

## 🏃 5. การเริ่มพัฒนา (Getting Started)

### Prerequisites
*   Android Studio Hedgehog (2023.1+) หรือใหม่กว่า
*   JDK 17
*   Android SDK 34
*   เครื่อง POS จริง (PAX/Verifone) หรือ Android Emulator API 26+

### Build & Run
```bash
# Clone monorepo
git clone <repository-url>
cd j-ledger-portal/apps/pos-terminal-app

# Open in Android Studio
# File → Open → select pos-terminal-app folder

# Build
./gradlew assembleDebug

# Run on device
./gradlew installDebug
```

### 🔧 Missing Dependencies to Add
เพิ่มใน `app/build.gradle.kts` ก่อนเริ่มพัฒนา Phase 1:
```kotlin
// Security — EncryptedSharedPreferences
implementation("androidx.security:security-crypto:1.1.0-alpha06")

// Navigation — Multi-screen flow
implementation("androidx.navigation:navigation-compose:2.7.7")

// Lifecycle — ViewModel + Compose integration
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
```

---

## 🔒 6. เช็คลิสต์ตรวจสอบความปลอดภัย (Terminal Audit Checklist)

ก่อนนำแอป POS เสนอให้ทีมประเมินผล Digio ตรวจสอบความปลอดภัยตามเกณฑ์ด้านการเงินเหล่านี้:
- [ ] **Root Status Block:** แอปต้องไม่สามารถเปิดทำงานได้ถ้าตรวจพบว่าอุปกรณ์ถูก Root หรืออยู่ใน Debug Mode
- [ ] **No Logging PAN/Token:** ต้องกรองเอาข้อมูลส่วนบุคคลและข้อมูลบัตรเครดิตออกไม่ให้ปรากฏลงใน `Logcat` ของแอปพลิเคชัน
- [ ] **Encrypted Storage:** ข้อมูลแคชยอดเงินที่ค้างอยู่ของร้านค้าต้องเข้ารหัสไว้ตลอดเวลา ไม่สามารถเปิดอ่านด้วยแอปแฮกเกอร์อื่นได้
- [ ] **HMAC Signature:** ทุก request ต้องเซ็น HMAC-SHA256 ด้วย `"${METHOD}:${path}:${timestamp}:${nonce}"` format
- [ ] **Nonce Uniqueness:** ทุก request ต้องมี nonce ที่ไม่ซ้ำกัน (Backend Redis SET NX EX 600s)
- [ ] **Timestamp Window:** Request ต้องถูกส่งภายใน ±5 นาทีจากเวลาจริง
- [ ] **ProGuard/R8:** Release build ต้องเปิด `isMinifyEnabled = true`

---

## 📂 7. โครงสร้างโปรเจกต์ปัจจุบัน (Current Project Structure)

```
pos-terminal-app/
├── PLAN.md                          ← แผนพัฒนาเชิงลึก (5 Phases)
├── README.md                        ← เอกสารนี้
├── build.gradle.kts                 ← Root Gradle config
├── settings.gradle.kts              ← Module registration
└── app/
    ├── build.gradle.kts             ← Dependencies & build config
    └── src/main/
        ├── AndroidManifest.xml      ← Permissions & Service registration
        ├── aidl/
        │   └── com/jledger/pos/
        │       └── IPrinterService.aidl    ← Printer IPC interface
        └── java/com/jledger/pos/
            ├── MainActivity.kt              ← Main UI (Numpad + Compliance)
            └── service/
                └── PrinterMockDriverService.kt  ← Mock printer service
```
