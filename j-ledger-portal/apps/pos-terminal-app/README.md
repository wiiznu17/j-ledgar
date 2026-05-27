# 🏦 J-Ledger POS: Smart Android Terminal Client 💳

> **แผนสถาปัตยกรรมและการพัฒนาซอฟต์แวร์เครื่องรับชำระเงินอัจฉริยะระบบ Android (Smart POS Terminal)**
> โปรเจกต์นี้จะติดตั้งอยู่บนฮาร์ดแวร์เครื่องรูดบัตรอัจฉริยะ (เช่นเครื่องแบรนด์ PAX หรือ Verifone) ทำหน้าที่เป็นจุดรับชำระเงินของร้านค้า (In-Store Payment Terminal) เชื่อมต่อ API Gateway หลังบ้านอย่างปลอดภัยด้วยลายเซ็นดิจิทัล HMAC SHA-256 และสั่งพิมพ์ใบเสร็จผ่านระบบบัสภายในระบบปฏิบัติการ Android (IPC via AIDL)

---

## 🎨 1. สถาปัตยกรรมระบบ (System Architecture)

แอป POS นี้จะทำงานแยกโปรเซสออกจากอุปกรณ์พิมพ์ใบเสร็จภายในตัวเครื่อง โดยใช้สถาปัตยกรรม **Clean Architecture + MVVM** และทำระบบความปลอดภัยที่อุปกรณ์ (Device-Level Security) ก่อนส่งธุรกรรมเข้าสู่ระบบคลาวด์ J-Ledger:

```
[ J-Ledger POS Application (Process A) ]
         │
         ├──► [ Presentation Layer ] (Jetpack Compose UI)
         ├──► [ Domain Layer ] (Use Cases & Business Logic)
         └──► [ Data Layer ] (Retrofit API Client & Secure Store)
                  │
                  ├───► [ Android Keystore ] (เก็บกุญแจลับระดับฮาร์ดแวร์)
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

## 🚀 3. แผนงานการพัฒนา (Development Roadmap)

เมื่อรันระบบ Compliance หลักฝั่งหลังบ้านตามแผน `docs/IMPLEMENTED_VS_PLANNED.md` เสร็จสมบูรณ์แล้ว ให้เริ่มลงมือสร้างแอปพลิเคชัน POS ตัวนี้ตามขั้นตอนดังนี้ครับ:

### Phase 1: การผูกอุปกรณ์และจัดเก็บคีย์ลับ (Secure Provisioning)
1.  **เป้าหมาย:** บันทึก `terminalId` และ `secretKey` (ที่ได้จากการจำลองสร้างเครื่อง POS หลังร้านในแอป Wallet) ลงเครื่องอย่างปลอดภัย
2.  **สิ่งที่ต้องเขียน:** หน้าจอลงทะเบียนเครื่อง POS รับข้อมูลผูกคีย์ จากนั้นใช้คลาส `KeyStore` ของ Android ในการเข้ารหัสข้อมูลเก็บลงใน `EncryptedSharedPreferences` ของแอป

### Phase 2: ระบบความปลอดภัยธุรกรรมชำระเงิน (HMAC Signature Interceptor)
1.  **เป้าหมาย:** สื่อสารกับ NestJS API ด้วยระบบการเซ็นลายเซ็นดิจิทัลตามมาตรฐานความปลอดภัย FinTech
2.  **สิ่งที่ต้องเขียน:** เขียนคลาส OkHttp `Interceptor` คอยดึง Payload ธุรกรรมมาสร้าง Signature ทุกครั้งก่อนส่งออกไป

#### 📝 โค้ดต้นแบบการสร้าง HMAC Signature ใน Kotlin:
```kotlin
package com.jledger.pos.security

import android.util.Base64
import java.security.SignatureException
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object HmacSigner {
    private const val HMAC_SHA256_ALGORITHM = "HmacSHA256"

    /**
     * คำนวณลายเซ็นดิจิทัลสำหรับความปลอดภัยของธุรกรรม
     */
    fun calculateSignature(payload: String, secretKey: String): String {
        return try {
            val signingKey = SecretKeySpec(secretKey.toByteArray(), HMAC_SHA256_ALGORITHM)
            val mac = Mac.getInstance(HMAC_SHA256_ALGORITHM)
            mac.init(signingKey)
            val rawHmac = mac.doFinal(payload.toByteArray())
            Base64.encodeToString(rawHmac, Base64.NO_WRAP)
        } catch (e: Exception) {
            throw SignatureException("Failed to generate HMAC SHA256 signature", e)
        }
    }
}
```

### Phase 3: ฟังก์ชันรับเงินหน้าร้านค้า (Transaction & QR Scanner)
1.  **เป้าหมาย:** ร้านค้ากรอกจำนวนยอดเงิน แล้วเลือกว่าจะสร้าง Dynamic QR เพื่อให้ลูกค้าสแกนจ่าย หรือสแกนกระเป๋าของลูกค้าเพื่อหักเงิน
2.  **สิ่งที่ต้องเขียน:** 
    *   หน้าแป้นพิมพ์ยอดเงิน (Numpad) กดป้อนเงิน
    *   ระบบสแกนกล้องหลัง (CameraX + ML Kit) ตรวจจับรหัส QR กระเป๋าผู้ใช้ส่งไปตัดเงินที่ API หลังบ้านปลายทาง `/merchant/terminal/payment`

### Phase 4: ระบบจำลองเครื่องพิมพ์ใบเสร็จ (Thermal Printer Service via AIDL)
1.  **เป้าหมาย:** เครื่อง POS จริงจะส่งข้อมูลใบเสร็จข้ามโปรเซส (IPC) เพื่อความปลอดภัย แอปหน้าร้านจะไม่คุยกับเครื่องพิมพ์ตรง ๆ แต่จะคุยผ่าน Service ไดรเวอร์ระบบ
2.  **สิ่งที่ต้องเขียน:** เขียนไฟล์ **AIDL** เพื่อสร้างอินเตอร์เฟสสื่อสาร และสร้าง Mock Service สำหรับรับคำสั่งพิมพ์สลิปและโชว์ใบเสร็จจำลองบนหน้าจอ

#### 📝 โค้ดต้นแบบอินเตอร์เฟส AIDL (`IPrinterService.aidl`):
สร้างไว้ที่โฟลเดอร์ `src/main/aidl/com/jledger/pos/IPrinterService.aidl`
```aidl
package com.jledger.pos;

interface IPrinterService {
    /**
     * ดึงสถานะปัจจุบันของเครื่องพิมพ์ (0: พร้อมใช้งาน, 1: กระดาษหมด, 2: ร้อนเกินกำหนด)
     */
    int getPrinterStatus();

    /**
     * สั่งพิมพ์ข้อความตัวอักษรลงบนกระดาษความร้อน
     */
    void printText(String text);

    /**
     * สั่งพิมพ์รูปภาพโลโก้หรือบาร์โค้ดสลิปธุรกรรม
     */
    void printBitmap(in byte[] bitmapData);

    /**
     * สั่งตัดกระดาษสลิปความร้อน
     */
    void cutPaper();
}
```

---

## 🔒 4. เช็คลิสต์ตรวจสอบความปลอดภัย (Terminal Audit Checklist)

ก่อนนำแอป POS เสนอให้ทีมประเมินผล Digio ตรวจสอบความปลอดภัยตามเกณฑ์ด้านการเงินเหล่านี้:
*   [ ] **Root Status Block:** แอปต้องไม่สามารถเปิดทำงานได้ถ้าตรวจพบว่าอุปกรณ์ถูก Root หรืออยู่ใน Debug Mode
*   [ ] **No Logging PAN/Token:** ต้องกรองเอาข้อมูลส่วนบุคคลและข้อมูลบัตรเครดิตออกไม่ให้ปรากฏลงใน `Logcat` ของแอปพลิเคชัน
*   [ ] **Encrypted Storage:** ข้อมูลแคชยอดเงินที่ค้างอยู่ของร้านค้าต้องเข้ารหัสไว้ตลอดเวลา ไม่สามารถเปิดอ่านด้วยแอปแฮกเกอร์อื่นได้
