# 🛠️ เจาะลึกสถาปัตยกรรม J-Ledger: การเชื่อมต่อและความปลอดภัย (Deep Dive)

เอกสารฉบับนี้อธิบายรายละเอียดทางเทคนิคเกี่ยวกับวิธีการที่ส่วนประกอบต่างๆ ของ J-Ledger เชื่อมต่อกันผ่าน Ports, Docker Network และการตั้งค่าใน Environment Variables เพื่อให้ระบบทำงานได้อย่างสมบูรณ์และปลอดภัย

---

## 🏗️ 1. ผังการไหลของข้อมูล (Traffic Flow)

เมื่อผู้ใช้งานเข้าถึงระบบผ่านเบราว์เซอร์ ลำดับการทำงานจะเป็นดังนี้:

1.  **Public Layer:** Traffic วิ่งเข้าหา Port 80/443 (Nginx)
2.  **Reverse Proxy Layer:** Nginx ตรวจสอบ URL และส่งต่อให้ Service ภายใน
3.  **Application Layer:** Portal และ BFF ประมวลผลและคุยกันเอง
4.  **Backend Layer:** Gateway กระจายงานสู่ Microservices ผ่าน Eureka
5.  **Data Layer:** Services จัดเก็บข้อมูลลงฐานข้อมูล (Isolation Mode)

---

## 📡 2. รายละเอียดพอร์ต (Ports Management)

ระบบมีการแบ่งพอร์ตออกเป็น 2 ประเภท คือ **Public** (เปิดให้คนนอกเข้า) และ **Internal** (คุยกันเฉพาะข้างใน)

| Service | Internal Port | External (Host) | สถานะ | หน้าที่ |
| :--- | :--- | :--- | :--- | :--- |
| **Nginx** | 80, 443 | 80, 443 | **Public** | จุดรับ Traffic จุดเดียวของระบบ |
| **Admin Web** | 3000 | - | Internal | เว็บพอร์ทัล (Next.js) |
| **Admin API** | 3001 | - | Internal | ระบบหลังบ้านสำหรับหน้าเว็บ (BFF) |
| **API Gateway** | 8080 | - | Internal | ประตูผ่านไปยัง Microservices |
| **Eureka** | 8761 | - | Internal | ทะเบียนรายชื่อ Service ทั้งหมด |
| **Core Service** | 8080 | - | Internal | ระบบหลักของบัญชีแยกประเภท |
| **PostgreSQL** | 5432 | - | **Isolated** | ฐานข้อมูลหลัก (ห้ามคนนอกต่อตรง) |
| **Redis** | 6379 | - | **Isolated** | ระบบจัดการ Cache และ Lock |

---

## 🌐 3. เครือข่ายภายใน (Docker Networking)

ระบบทำงานบน **Docker Bridge Network** ที่ชื่อว่า `jledger-network`

### การเรียกหาด้วยชื่อ (Internal DNS)
คอนเทนเนอร์ในระบบไม่จำเป็นต้องรู้ IP ของกันและกัน แต่จะใช้วิธีเรียกผ่าน **Service Name** ที่ระบุใน `docker-compose.yml`:
*   BFF เรียกไปที่ `http://api-gateway:8080`
*   Core Service ต่อฐานข้อมูลที่ `jdbc:postgresql://postgres:5432/...`

### ระบบ Isolation
เนื่องจากเราไม่ได้ใส่คำสั่ง `ports:` ให้กับ Postgres และ Redis ใน `docker-compose.yml` ทำให้พอร์ตเหล่านี้ **"ปิดตาย"** สำหรับโลกภายนอก (Security by Default) แต่ `core-service` ที่อยู่ใน Network เดียวกันจะเห็นและทำงานได้ปกติ

---

## ⚙️ 4. การตั้งค่าสำคัญ (Core Configurations)

ค่าต่างๆ ในไฟล์ `.env` คือสิ่งที่ร้อยเรียงทุุกอย่างเข้าด้วยกัน:

### 4.1 การสื่อสารภายใน (BFF <-> Portal)
*   **`INTERNAL_API_URL=http://admin-api:3001`**: สำคัญมากสำหรับการทำ SSR (Server-Side Rendering) ของ Next.js เพื่อให้ Server หน้าบ้านคุยกับ API หลังบ้านได้โดยตรงไม่ผ่านเน็ตนอก

### 4.2 ระบบรักษาความปลอดภัย (Security Secrets)
*   **`JWT_SECRET`**: กุญแจสำหรับการลงนาม Token ของ User ถ้าตั้งไม่ตรงกัน หน้าบ้านจะตรวจสอบตัวตน User ไม่ได้
*   **`JLEDGER_INTERNAL_SECRET`**: รหัสพิเศษที่แนบไปใน HTTP Header เมื่อ Service คุยกันเอง (Internal Auth) เพื่อให้มั่นใจว่าคำสั่งนั้นมาจากระบบของเราจริงๆ ไม่ได้ถูกแฮก

### 4.3 การค้นหาบริการ (Service Discovery)
*   **Eureka Zone**: `http://eureka-server:8761/eureka/`
    *   ทุก Microservice จะ "รายงานตัว" ที่นี่
    *   API Gateway จะถาม Eureka ว่าจะส่ง Payload ไปที่ไหน ทำให้เราสามารถรันหลาย Instances ของ Core Service ได้โดยไม่ต้องเปลี่ยน Config

---

## 🔒 5. สรุปความปลอดภัย (Security Architecture)

1.  **Single Entry Point**: มีเพียง Nginx เท่านั้นที่เปิดพอร์ตสู่สาธารณะ
2.  **No Direct DB Access**: ฐานข้อมูลถูกซ่อนอยู่หลัง Network ภายใน
3.  **Encrypted Internals**: การสื่อสารที่สำคัญต้องมี Internal Secret เสมอ
4.  **SSL/TLS**: Traffic จาก User มายัง Nginx ถูกเข้ารหัสด้วยใบรับรองจาก Certbot (Let's Encrypt)

---
*เอกสารนี้จัดทำเพื่อช่วยในการตรวจสอบและดูแลรักษาระบบ J-Ledger ในระยะยาว*
