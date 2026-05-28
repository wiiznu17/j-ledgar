# 🗺️ J-Ledger POS: แผนและคู่มือพัฒนาต่อ (Development Roadmap)

> **คู่มือสถาปัตยกรรมและการพัฒนาซอฟต์แวร์เครื่องรับชำระเงิน POS ในเฟสถัดไป**
> เอกสารฉบับนี้อัปเดตให้ตรงกับ API Backend จริงของระบบ J-Ledger (NestJS BFF + Spring Boot Core) โดยครอบคลุมทั้ง **POS Payment** และ **Deal Redemption** flow

---

## 🏗️ 1. สรุปโครงสร้างโมดูล Android ในปัจจุบัน (Project Structure)
โปรเจกต์ได้รับการขึ้นโครงสร้างเริ่มต้น (Skeleton) ตามมาตรฐาน Android Modern Development (Kotlin DSL + Jetpack Compose) ไว้แล้วดังนี้:
*   `settings.gradle.kts` & `build.gradle.kts`: ไฟล์กำหนดโมดูลและปลั๊กอินทั้งหมด
*   `app/build.gradle.kts`: รวบรวม Dependencies หลัก (Compose M3, CameraX, ML Kit, Retrofit, OkHttp, Rootbeer)
*   `AndroidManifest.xml`: ขอสิทธิ์ใช้งานกล้องและอินเทอร์เน็ต พร้อมลงทะเบียน Mock ไดรเวอร์เครื่องพิมพ์ความร้อน
*   `MainActivity.kt`: หน้าจอหลักสไตล์ Material 3 ดาร์กโหมด แสดงผลสถานะความปลอดภัย และมีแป้นพิมพ์ Numpad
*   `IPrinterService.aidl` & `PrinterMockDriverService.kt`: ระบบพิมพ์ใบเสร็จและติดต่อฮาร์ดแวร์แบบข้ามโปรเซส (IPC via AIDL)

### ⚠️ สิ่งที่ยังขาดใน Skeleton ปัจจุบัน
*   **ไม่มี dependency** `androidx.security:security-crypto` สำหรับ `EncryptedSharedPreferences`
*   **ไม่มี dependency** `androidx.navigation:navigation-compose` สำหรับ Multi-screen Navigation
*   **ไม่มี dependency** `androidx.datastore:datastore-preferences` (ทางเลือกแทน SharedPreferences)
*   **ขาดโฟลเดอร์สำคัญ** `network/`, `security/`, `ui/screens/`, `data/model/` ยังไม่มีใน project structure

---

## 📡 2. API Endpoints จริงของระบบ BFF (Actual Backend Contract)

### 🔐 Authentication Headers (TerminalAuthGuard)
ทุก Request ที่ส่งจาก POS ต้องมี **4 headers** ดังนี้:

| Header | ตัวอย่าง | คำอธิบาย |
|---|---|---|
| `X-JLedger-Terminal-Id` | `clxyz123...` | Terminal UUID ที่ได้จากการลงทะเบียนเครื่อง |
| `X-JLedger-Signature` | `a3f2b...` (hex) | HMAC-SHA256 signature |
| `X-JLedger-Timestamp` | `1716912000` | Unix epoch seconds |
| `X-JLedger-Nonce` | `nonce_pos_abc123` | Random string กันการ Replay Attack (ใช้ครั้งเดียว) |

### 🔑 Signature Calculation (สำคัญมาก — ต้องตรงกับ Backend)
```
message = "${METHOD}:${path}:${timestamp}:${nonce}"
signature = HMAC-SHA256(message, secretKey).toHex()
```

**ตัวอย่าง:**
```
METHOD   = "POST"
path     = "/api/v1/terminal/payment"
timestamp = "1716912000"
nonce    = "nonce_pos_abc123"

message  = "POST:/api/v1/terminal/payment:1716912000:nonce_pos_abc123"
signature = hmac_sha256(message, secretKey) → hex output
```

> **⚠️ สำคัญ:** Backend ใช้ `timingSafeEqual` เปรียบเทียบ signature และจะ reject ถ้า timestamp เกิน **±5 นาที**
> Nonce จะถูกบันทึกใน Redis (SET NX EX 600s) → ใช้ซ้ำไม่ได้

### 📋 API Endpoints

#### 1. POS Payment — `POST /api/v1/terminal/payment`
```json
{
  "amount": 250.00,
  "idempotencyKey": "idem_pos_pay_998877ab",
  "note": "POS Scan-to-Pay Lunch",
  "customerToken": "PAY-E7A4F8B2"
}
```
**Response:**
```json
{
  "status": 201,
  "data": {
    "success": true,
    "transactionId": "txn_tm_pmt_...",
    "amount": 250.00,
    "currency": "THB"
  }
}
```

#### 2. Loyalty Redemption — `POST /api/v1/terminal/loyalty/redeem`
```json
{
  "redemptionCode": "RED-123-456",
  "idempotencyKey": "idem_pos_redeem_xyz123ab"
}
```

#### 3. Deal Verify — `GET /api/merchant/deals/redemptions/:code/verify`
ตรวจสอบ Deal Redemption Code ก่อนกดยืนยัน (Preview ข้อมูล deal)
```json
// Response:
{
  "isValid": true,
  "dealTitle": "Free Coffee",
  "brandName": "Starbucks",
  "pointsSpent": 100,
  "expiresAt": "2026-06-01T00:00:00.000Z"
}
```

#### 4. Deal Use — `POST /api/merchant/deals/redemptions/:code/use`
ยืนยันการใช้ Deal Redemption Code (เปลี่ยนสถานะเป็น USED)
```json
// Response:
{
  "success": true,
  "usedAt": "2026-05-28T12:00:00.000Z",
  "redemptionId": "clxyz456..."
}
```

---

## 🚀 3. แผนงานการพัฒนา 5 เฟสหลัก (Implementation Phases)

### 🔒 Phase 1: การลงทะเบียนเครื่องและการเก็บคีย์ลับ (Secure Device Provisioning)
1.  **แนวคิด:** เครื่อง POS จะต้องมี `terminalId` และ `secretKey` ประจำเครื่องซึ่งออกให้โดยระบบ Admin Dashboard คีย์เหล่านี้มีความสำคัญระดับความมั่นคงสูง ต้องห้ามบันทึกเป็น Plain Text
2.  **ขั้นตอนพัฒนา:**
    *   **เพิ่ม dependency** `implementation("androidx.security:security-crypto:1.1.0-alpha06")` ใน `app/build.gradle.kts`
    *   สร้างหน้าจอ **Setup Terminal** สำหรับให้ผู้ดูแลกรอกข้อมูลคีย์หรือสแกน QR เพื่อผูกอุปกรณ์
    *   ใช้ **Android Keystore API** เพื่อสร้างคีย์เข้ารหัสระดับฮาร์ดแวร์ (TEE/Secure Element)
    *   จัดเก็บคีย์ลับลงใน `EncryptedSharedPreferences` เพื่อเข้ารหัสไฟล์ข้อมูลของแอปโดยอัตโนมัติ

#### 📝 โค้ดต้นแบบการบันทึกคีย์อย่างปลอดภัยใน Android:
```kotlin
package com.jledger.pos.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class SecureStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_pos_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveTerminalCredentials(terminalId: String, secretKey: String) {
        sharedPreferences.edit()
            .putString("terminal_id", terminalId)
            .putString("secret_key", secretKey)
            .apply()
    }

    fun getSecretKey(): String? = sharedPreferences.getString("secret_key", null)
    fun getTerminalId(): String? = sharedPreferences.getString("terminal_id", null)
    fun isProvisioned(): Boolean = getTerminalId() != null && getSecretKey() != null
}
```

---

### 🔑 Phase 2: ระบบเซ็นลายเซ็นดิจิทัลและป้องกัน Replay (HMAC-SHA256 + Nonce Interceptor)
1.  **แนวคิด:** เพื่อป้องกันการปลอมแปลงยอดเงินหรือดักจับแก้ไข Payload ระหว่างทาง เครื่อง POS จะต้องเซ็น Signature ตาม **format ที่ Backend ตรวจจริง** พร้อม Nonce กันโจมตีแบบ Replay Attack
2.  **ขั้นตอนพัฒนา:**
    *   สร้าง OkHttp `Interceptor` ดักจับทุก Request ที่ยิงไปที่ Gateway
    *   สร้าง Nonce แบบสุ่มทุกครั้ง (e.g. `UUID.randomUUID()`)
    *   คำนวณ Signature ตามสูตร: `"${METHOD}:${path}:${timestamp}:${nonce}"`
    *   แนบ **4 headers**: `X-JLedger-Terminal-Id`, `X-JLedger-Signature`, `X-JLedger-Timestamp`, `X-JLedger-Nonce`

#### 📝 โค้ดต้นแบบ OkHttp Security Interceptor (ตรงกับ Backend จริง):
```kotlin
package com.jledger.pos.network

import com.jledger.pos.security.SecureStorage
import okhttp3.Interceptor
import okhttp3.Response
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

class HmacSigningInterceptor(private val secureStorage: SecureStorage) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val terminalId = secureStorage.getTerminalId() ?: return chain.proceed(originalRequest)
        val secretKey = secureStorage.getSecretKey() ?: return chain.proceed(originalRequest)

        val timestamp = (System.currentTimeMillis() / 1000).toString()  // Unix epoch seconds
        val nonce = "nonce_pos_${UUID.randomUUID().toString().replace("-", "").take(16)}"

        // Signature format ตรงกับ Backend: "${METHOD}:${path}:${timestamp}:${nonce}"
        val method = originalRequest.method.uppercase()
        val path = originalRequest.url.encodedPath
        val message = "$method:$path:$timestamp:$nonce"
        val signature = calculateHmacSha256Hex(message, secretKey)

        val secureRequest = originalRequest.newBuilder()
            .header("X-JLedger-Terminal-Id", terminalId)
            .header("X-JLedger-Signature", signature)
            .header("X-JLedger-Timestamp", timestamp)
            .header("X-JLedger-Nonce", nonce)
            .build()

        return chain.proceed(secureRequest)
    }

    private fun calculateHmacSha256Hex(data: String, key: String): String {
        val mac = Mac.getInstance("HmacSHA256")
        val secretKeySpec = SecretKeySpec(key.toByteArray(), "HmacSHA256")
        mac.init(secretKeySpec)
        return mac.doFinal(data.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
```

> **⚠️ จุดสำคัญ:**
> - Timestamp ต้องเป็น **Unix epoch seconds** (ไม่ใช่ milliseconds) — Backend ตรวจสอบ `Math.abs(now - ts) > 300` (5 นาที)
> - Signature output ต้องเป็น **hex string** (ไม่ใช่ Base64) — Backend ใช้ `.digest('hex')` ใน Node.js
> - Nonce ต้อง **ไม่ซ้ำกันทุกครั้ง** — Backend จัดเก็บใน Redis ด้วย `SET NX EX 600`

---

### 📷 Phase 3: ระบบรับชำระเงินหน้าร้านค้า (CameraX + ML Kit QR Scanner + Pay Token)
1.  **แนวคิด:** เมื่อกดจำนวนเงินบน POS เสร็จสมบูรณ์ พนักงานเลือกโหมด **"Scan Customer"** เปิดกล้องหลังเพื่อสแกน QR Code จากหน้าจอมือถือลูกค้า ซึ่งจะได้ Customer Pay Token (format `PAY-XXXXXXXX`) แล้วยิง API ตัดเงินทันที
2.  **Flow สมบูรณ์:**
    ```
    [ลูกค้า] P-Wallet App → เปิดหน้าจอ "จ่ายหน้าร้าน" → แสดง QR Code ของ Pay Token (PAY-XXXXXXXX)
                                                                     ↓
    [พนักงาน] POS → กด Numpad ใส่ยอดเงิน → กดปุ่ม "Scan Customer"
                                                                     ↓
    [POS กล้อง] CameraX + ML Kit → สแกน QR ได้ "PAY-E7A4F8B2"
                                                                     ↓
    [POS] → ยิง POST /api/v1/terminal/payment { amount, customerToken: "PAY-E7A4F8B2", idempotencyKey }
                                                                     ↓
    [Backend] → ตรวจ Redis → ตัดเงินลูกค้า → โอนเข้าบัญชี Merchant → ส่ง response
                                                                     ↓
    [POS] → แสดงผลสำเร็จ → พิมพ์ใบเสร็จ
    ```
3.  **ขั้นตอนพัฒนา:**
    *   ผูก CameraX `PreviewView` เข้ากับ Jetpack Compose UI
    *   ดึงเฟรมภาพส่งให้ **Google ML Kit Barcode Scanning** คอยถอดรหัส QR ทุกๆ วินาที
    *   เมื่อเจอข้อความที่ขึ้นต้นด้วย `PAY-` ให้ยิงเรียก `POST /api/v1/terminal/payment` พร้อม `customerToken` ทันที
    *   แสดงผลสำเร็จพร้อมสั่งพิมพ์ใบเสร็จ

---

### 🎁 Phase 4: ระบบ Deal Redemption หน้าร้าน (Deal Verify + Use Flow) — **ใหม่**
1.  **แนวคิด:** ลูกค้าที่ได้ deal/coupon จากระบบ Loyalty จะมี Redemption Code (format `RED-XXX-XXX`) พนักงานหน้าร้านจะสแกนหรือกรอกโค้ดที่เครื่อง POS เพื่อตรวจสอบและยืนยันการใช้สิทธิ์
2.  **Two-Step Flow (Verify → Use):**
    ```
    [ลูกค้า] → แสดง QR/รหัส Redemption Code ที่มือถือ
                          ↓
    [POS] → Step 1: GET /api/merchant/deals/redemptions/{code}/verify
              → แสดงข้อมูล Deal: ชื่อ deal, ชื่อ brand, จำนวน points ที่ใช้ไป
              → ให้พนักงานตรวจสอบแล้วกด "Confirm Use"
                          ↓
    [POS] → Step 2: POST /api/merchant/deals/redemptions/{code}/use
              → Backend เปลี่ยนสถานะเป็น USED + บันทึกร้านค้าที่ใช้
              → แสดงผลสำเร็จพร้อมพิมพ์ใบเสร็จ
    ```
3.  **ขั้นตอนพัฒนา:**
    *   สร้างหน้าจอ **Deal Redemption** แยกจากหน้าชำระเงิน
    *   เพิ่มปุ่มเปลี่ยนโหมดใน Bottom Navigation: `💳 ชำระเงิน` | `🎁 ใช้สิทธิ์ Deal`
    *   สร้าง Retrofit Interface สำหรับ Deal API
    *   สร้างหน้าจอ Preview (แสดงชื่อ deal, brand, points) + ปุ่ม Confirm/Cancel
    *   Handle error cases: Code ไม่ถูกต้อง, Code ใช้แล้ว, Code หมดอายุ, Deal ไม่ตรง Partner

#### 📝 โค้ดต้นแบบ Retrofit Interface:
```kotlin
package com.jledger.pos.network

import retrofit2.http.*

data class PaymentRequest(
    val amount: Double,
    val idempotencyKey: String,
    val note: String? = null,
    val customerToken: String? = null
)

data class PaymentResponse(
    val status: Int,
    val data: PaymentData
)

data class PaymentData(
    val success: Boolean,
    val transactionId: String,
    val amount: Double,
    val currency: String
)

data class RedemptionRequest(
    val redemptionCode: String,
    val idempotencyKey: String
)

data class DealVerifyResponse(
    val isValid: Boolean,
    val dealTitle: String,
    val brandName: String,
    val pointsSpent: Int,
    val expiresAt: String?
)

data class DealUseResponse(
    val success: Boolean,
    val usedAt: String,
    val redemptionId: String
)

interface PosApiService {
    @POST("v1/terminal/payment")
    suspend fun processPayment(@Body request: PaymentRequest): PaymentResponse

    @POST("v1/terminal/loyalty/redeem")
    suspend fun processRedemption(@Body request: RedemptionRequest): Any

    @GET("merchant/deals/redemptions/{code}/verify")
    suspend fun verifyDeal(@Path("code") code: String): DealVerifyResponse

    @POST("merchant/deals/redemptions/{code}/use")
    suspend fun useDeal(@Path("code") code: String): DealUseResponse
}
```

---

### 🖨️ Phase 5: ระบบพิมพ์สลิปและเชื่อมต่อ AIDL (IPC Thermal Printer Connection)
1.  **แนวคิด:** เพื่อป้องกันการสั่งพิมพ์มั่วจากภายนอก ไดรเวอร์เครื่องพิมพ์ความร้อนจะรันเป็นอีก Process หนึ่งแยกออกไป แอปขายหน้าร้านของเราจะใช้ **AIDL (Android Interface Definition Language)** ในการส่งข้อมูลข้าม Process ไปสั่งพิมพ์และตัดกระดาษ
2.  **ขั้นตอนพัฒนา:**
    *   เชื่อมต่อ Binder Service ใน `MainActivity` โดยใช้ `bindService()` กับแอคชัน `"com.jledger.pos.IPrinterService"`
    *   เมื่อเชื่อมต่อสำเร็จ จะได้อินสแตนซ์ของอินเตอร์เฟส `IPrinterService`
    *   สร้างใบเสร็จธุรกรรมทางการเงินและยิงสั่งพิมพ์ตัวอักษร, สั่งตัดกระดาษผ่านคำสั่ง `printText()` และ `cutPaper()`
    *   สร้างใบเสร็จ 2 แบบ: **Payment Slip** (ยอดเงิน, TXN ID) และ **Deal Redemption Slip** (ชื่อ deal, brand, redemption code)

#### 📝 โค้ดต้นแบบการสั่งพิมพ์ข้ามโปรเซสผ่าน Service:
```kotlin
package com.jledger.pos.printer

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import com.jledger.pos.IPrinterService

class PrinterManager(private val context: Context) {
    private var printerService: IPrinterService? = null

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            printerService = IPrinterService.Stub.asInterface(service)
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            printerService = null
        }
    }

    fun connect() {
        val intent = Intent("com.jledger.pos.IPrinterService")
        intent.setPackage("com.jledger.pos")
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    fun printPaymentReceipt(txnId: String, amount: String, timestamp: String) {
        printerService?.let { service ->
            if (service.printerStatus == 0) {
                service.printText("     J-LEDGER RECEIPT     \n")
                service.printText("--------------------------\n")
                service.printText("TXN ID: $txnId\n")
                service.printText("AMOUNT: ฿$amount\n")
                service.printText("DATE: $timestamp\n")
                service.printText("--------------------------\n")
                service.printText("    THANK YOU FOR PAYING  \n\n\n")
                service.cutPaper()
            }
        }
    }

    fun printDealRedemptionReceipt(
        dealTitle: String,
        brandName: String,
        redemptionCode: String,
        timestamp: String
    ) {
        printerService?.let { service ->
            if (service.printerStatus == 0) {
                service.printText("   J-LEDGER DEAL RECEIPT  \n")
                service.printText("--------------------------\n")
                service.printText("DEAL: $dealTitle\n")
                service.printText("BRAND: $brandName\n")
                service.printText("CODE: $redemptionCode\n")
                service.printText("DATE: $timestamp\n")
                service.printText("--------------------------\n")
                service.printText("  DEAL REDEEMED SUCCESS!  \n\n\n")
                service.cutPaper()
            }
        }
    }

    fun disconnect() {
        context.unbindService(connection)
    }
}
```

---

## 🔒 4. แนวทางด้านความปลอดภัยสำหรับด่านผู้ตรวจสอบของ Digio (Security Guidelines)
เมื่อเขียนโค้ด ให้ระลึกถึงมาตรฐานความปลอดภัยของ Payment Terminal อยู่เสมอ:
1.  **Root & Emulator Status Checks:** ที่จุดเริ่มต้นแอป ควรทริกเกอร์ `RootBeer.isRooted()` เสมอ หากตรวจพบเครื่องถูกรูท ให้ปิดแอปเพื่อความปลอดภัยทันที
2.  **No sensitive values in logs:** ตรวจทานโค้ดอย่างเข้มงวด ห้ามสั่งพิมพ์ `secretKey`, `token` หรือข้อมูลส่วนบุคคลใดๆ ลงใน `Log.d` หรือ `Log.i`
3.  **ProGuard / R8 Obfuscation:** ปล่อยแอปด้วยการเปิดใช้งาน ProGuard (`isMinifyEnabled = true`) เพื่อทำการแฮชโค้ดคลาสและตัวแปรต่างๆ ป้องกันการ Reverse Engineering คีย์ลับ
4.  **HMAC Nonce Uniqueness:** ต้องสร้าง nonce ใหม่ทุกครั้ง ห้ามใช้ counter ที่ reset ได้ ใช้ `UUID.randomUUID()` เป็น recommended approach
5.  **Timestamp Window:** ต้องตั้งนาฬิกาเครื่องให้ตรงกับ NTP server เพราะ Backend ปฏิเสธ request ที่ timestamp ห่างจากเวลาจริงเกิน 5 นาที

---

## 📦 5. Missing Dependencies ที่ต้องเพิ่มใน `app/build.gradle.kts`
```kotlin
// Security — EncryptedSharedPreferences (Phase 1)
implementation("androidx.security:security-crypto:1.1.0-alpha06")

// Navigation — Multi-screen flow (Phase 3-4)
implementation("androidx.navigation:navigation-compose:2.7.7")

// Lifecycle — ViewModel + Compose integration
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
```

---

## 🗂️ 6. โครงสร้างโฟลเดอร์แนะนำ (Recommended Package Structure)
```
com.jledger.pos/
├── MainActivity.kt
├── ui/
│   ├── screens/
│   │   ├── PaymentScreen.kt       (Numpad + ยอดเงิน)
│   │   ├── ScannerScreen.kt       (CameraX + ML Kit)
│   │   ├── DealRedemptionScreen.kt (กรอก/สแกน Redemption Code)
│   │   ├── DealPreviewScreen.kt   (แสดง deal ก่อนยืนยัน)
│   │   ├── SetupScreen.kt         (ลงทะเบียนเครื่อง)
│   │   └── ResultScreen.kt        (ผลสำเร็จ/ล้มเหลว)
│   ├── components/
│   │   ├── NumpadButton.kt
│   │   ├── ComplianceIndicator.kt
│   │   └── PosNavigation.kt
│   └── theme/
│       └── PosTheme.kt
├── network/
│   ├── PosApiService.kt           (Retrofit interface)
│   ├── HmacSigningInterceptor.kt  (Security Interceptor)
│   └── ApiClient.kt               (Retrofit singleton)
├── security/
│   ├── SecureStorage.kt           (EncryptedSharedPreferences)
│   └── RootDetector.kt            (Rootbeer wrapper)
├── data/
│   └── model/
│       ├── PaymentRequest.kt
│       ├── PaymentResponse.kt
│       ├── DealVerifyResponse.kt
│       └── DealUseResponse.kt
├── printer/
│   └── PrinterManager.kt          (AIDL IPC Manager)
└── service/
    └── PrinterMockDriverService.kt
```
