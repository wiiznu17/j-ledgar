# 🗺️ J-Ledger POS: แผนและคู่มือพัฒนาต่อ (Development Roadmap)

> **คู่มือสถาปัตยกรรมและการพัฒนาซอฟต์แวร์เครื่องรับชำระเงิน POS ในเฟสถัดไป**
> เอกสารฉบับนี้ร่างขึ้นหลังจากที่เราทำการเปิดระบบตรวจสอบความปลอดภัย (Compliance Layer: KYC, Rate Limit, Transaction Limit) ในระบบ Spring Boot หลังบ้านสำเร็จเรียบร้อยแล้ว โดยจะอธิบายวิธีการเขียนโค้ดและเชื่อมต่อฝั่ง Android POS Client ให้สมบูรณ์แบบสูงสุดสำหรับนำเสนอทีมผู้ประเมิน Digio

---

## 🏗️ 1. สรุปโครงสร้างโมดูล Android ในปัจจุบัน (Project Structure)
โปรเจกต์ได้รับการขึ้นโครงสร้างเริ่มต้น (Skeleton) ตามมาตรฐาน Android Modern Development (Kotlin DSL + Jetpack Compose) ไว้แล้วดังนี้:
*   `settings.gradle.kts` & `build.gradle.kts`: ไฟล์กำหนดโมดูลและปลั๊กอินทั้งหมด
*   `app/build.gradle.kts`: รวบรวม Dependencies หลัก (Compose M3, CameraX, ML Kit, Retrofit, OkHttp, Rootbeer)
*   `AndroidManifest.xml`: ขอสิทธิ์ใช้งานกล้องและอินเทอร์เน็ต พร้อมลงทะเบียน Mock ไดรเวอร์เครื่องพิมพ์ความร้อน
*   `MainActivity.kt`: หน้าจอหลักสไตล์ Material 3 ดาร์กโหมด แสดงผลสถานะความปลอดภัย และมีแป้นพิมพ์ Numpad
*   `IPrinterService.aidl` & `PrinterMockDriverService.kt`: ระบบพิมพ์ใบเสร็จและติดต่อฮาร์ดแวร์แบบข้ามโปรเซส (IPC via AIDL)

---

## 🚀 2. แผนงานการพัฒนา 4 เฟสหลัก (Next-Step Implementation Phases)

เมื่อคุณพร้อมพัฒนาต่อ ให้ดำเนินการตามขั้นตอนเชิงลึกเหล่านี้:

### 🔒 Phase 1: การลงทะเบียนเครื่องและการเก็บคีย์ลับ (Secure Device Provisioning)
1.  **แนวคิด:** เครื่อง POS จะต้องมี `terminalId` และ `secretKey` ประจำเครื่องซึ่งออกให้โดยระบบ Wallet หลังร้าน คีย์เหล่านี้มีความสำคัญระดับความมั่นคงสูง ต้องห้ามบันทึกเป็น Plain Text
2.  **ขั้นตอนพัฒนา:**
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
}
```

---

### 🔑 Phase 2: ระบบเซ็นลายเซ็นดิจิทัลของธุรกรรม (HMAC-SHA256 Transaction Interceptor)
1.  **แนวคิด:** เพื่อป้องกันการปลอมแปลงยอดเงินหรือดักจับแก้ไข Payload ระหว่างทาง เครื่อง POS จะต้องใช้ `secretKey` มารับรู้ข้อมูลและแฮชรวมกับ Timestamp เกิดเป็นดิจิทัลซิกเนเจอร์ ส่งควบคู่ไปใน Header ทุกครั้ง
2.  **ขั้นตอนพัฒนา:**
    *   สร้าง OkHttp `Interceptor` ดักจับทุก Request ที่ยิงไปที่ Gateway
    *   ดึง HTTP Body มาสร้าง Signature ด้วยอัลกอริทึม HMAC-SHA256
    *   แนบข้อมูล `X-Terminal-Signature`, `X-Terminal-Id`, และ `X-Terminal-Timestamp` ไปใน Header

#### 📝 โค้ดต้นแบบ OkHttp Security Interceptor:
```kotlin
package com.jledger.pos.network

import com.jledger.pos.security.SecureStorage
import okhttp3.Interceptor
import okhttp3.Response
import okio.Buffer
import java.security.SignatureException
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import android.util.Base64

class HmacSigningInterceptor(private val secureStorage: SecureStorage) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val terminalId = secureStorage.getTerminalId() ?: return chain.proceed(originalRequest)
        val secretKey = secureStorage.getSecretKey() ?: return chain.proceed(originalRequest)

        val timestamp = System.currentTimeMillis().toString()
        val bodyString = originalRequest.body?.let {
            val buffer = Buffer()
            it.writeTo(buffer)
            buffer.readUtf8()
        } ?: ""

        // Signature Payload = timestamp + requestURI + body
        val signaturePayload = timestamp + originalRequest.url.encodedPath + bodyString
        val signature = calculateHmacSha256(signaturePayload, secretKey)

        val secureRequest = originalRequest.newBuilder()
            .header("X-Terminal-Id", terminalId)
            .header("X-Terminal-Timestamp", timestamp)
            .header("X-Terminal-Signature", signature)
            .build()

        return chain.proceed(secureRequest)
    }

    private fun calculateHmacSha256(data: String, key: String): String {
        val sha256HMAC = Mac.getInstance("HmacSHA256")
        val secretKeySpec = SecretKeySpec(key.toByteArray(), "HmacSHA256")
        sha256HMAC.init(secretKeySpec)
        return Base64.encodeToString(sha256HMAC.doFinal(data.toByteArray()), Base64.NO_WRAP)
    }
}
```

---

### 📷 Phase 3: ระบบสแกนรับเงินหน้าร้านค้า (CameraX + ML Kit Integration)
1.  **แนวคิด:** เมื่อกดจำนวนเงินบน POS เสร็จสมบูรณ์ หากร้านค้าเลือกโหมด "Scan Customer" แอปจะต้องเปิดกล้องหลังเพื่อสแกน QR Code (Wallet UUID) จากโทรศัพท์ของลูกค้าอย่างรวดเร็วและปลอดภัย
2.  **ขั้นตอนพัฒนา:**
    *   ผูก CameraX `PreviewView` เข้ากับ Jetpack Compose UI
    *   ดึงเฟรมภาพส่งให้ **Google ML Kit Barcode Scanning** คอยถอดรหัสรหัส QR ทุกๆ วินาที
    *   เมื่อเจอข้อความรูป UUID บัญชีลูกค้า ให้ยิงเรียก API สั่งตัดเงินทันที

---

### 🖨️ Phase 4: ระบบพิมพ์สลิปและเชื่อมต่อ AIDL (IPC Thermal Printer Connection)
1.  **แนวคิด:** เพื่อป้องกันการสั่งพิมพ์มั่วจากภายนอก ไดรเวอร์เครื่องพิมพ์ความร้อนจะรันเป็นอีก Process หนึ่งแยกออกไป แอปขายหน้าร้านของเราจะใช้ **AIDL (Android Interface Definition Language)** ในการส่งข้อมูลข้าม Process ไปสั่งพิมพ์และตัดกระดาษ
2.  **ขั้นตอนพัฒนา:**
    *   เชื่อมต่อ Binder Service ใน `MainActivity` โดยใช้ `bindService()` กับแอคชัน `"com.jledger.pos.IPrinterService"`
    *   เมื่อเชื่อมต่อสำเร็จ จะได้อินสแตนซ์ของอินเตอร์เฟส `IPrinterService`
    *   สร้างใบเสร็จธุรกรรมทางการเงินและยิงสั่งพิมพ์ตัวอักษร, สั่งตัดกระดาษผ่านคำสั่ง `printText()` และ `cutPaper()`

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
        intent.setPackage("com.jledger.pos") // ระบุ package ของแอป
        context.bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    fun printReceipt(txnId: String, amount: String, timestamp: String) {
        printerService?.let { service ->
            if (service.printerStatus == 0) { // 0 คือ พร้อมพิมพ์
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

    fun disconnect() {
        context.unbindService(connection)
    }
}
```

---

## 🔒 3. แนวทางด้านความปลอดภัยสำหรับด่านผู้ตรวจสอบของ Digio (Security Guidelines)
เมื่อเขียนโค้ด ให้ระลึกถึงมาตรฐานความปลอดภัยของ Payment Terminal อยู่เสมอ:
1.  **Root & Emulator Status Checks:** ที่จุดเริ่มต้นแอป ควรทริกเกอร์ `RootBeer.isRooted()` เสมอ หากตรวจพบเครื่องถูกรูท ให้ปิดแอปเพื่อความปลอดภัยทันที
2.  **No sensitive values in logs:** ตรวจทานโค้ดอย่างเข้มงวด ห้ามสั่งพิมพ์ `secretKey`, `token` หรือข้อมูลส่วนบุคคลใดๆ ลงใน `Log.d` หรือ `Log.i`
3.  **ProGuard / R8 Obfuscation:** ปล่อยแอปด้วยการเปิดใช้งาน ProGuard (`isMinifyEnabled = true`) เพื่อทำการแฮชโค้ดคลาสและตัวแปรต่างๆ ป้องกันการ Reverse Engineering คีย์ลับ
