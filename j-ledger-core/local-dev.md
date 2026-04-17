# 🛠️ คู่มือการรัน J-Ledger สำหรับ Local Development

คู่มือนี้สำหรับนักพัฒนาที่ต้องการรัน **Infrastructure ใน Docker** และรัน **Services (Java/Next.js) บนเครื่องตัวเอง (Host)** เพื่อความรวดเร็วในการ Debug และ Hot Reload

---

## 1. เตรียมระบบพื้นฐาน (Docker)
รัน Infrastructure ที่จำเป็น (Database, Redis, Kafka) โดยใช้คำสั่ง:

```bash
# 1. เริ่มระบบพื้นฐาน (Database, Redis, Kafka)
cd j-ledger-core
docker compose -f docker-compose.infra.yml up -d

# 2. ตั้งค่า Nginx สำหรับใช้งานในเครื่อง (Local)
cd ..
cp docker/nginx/default.conf.local docker/nginx/default.conf
```

**รายการพอร์ตที่เปิดใช้งานบน localhost:**
- Postgres: `5432`
- Redis: `6379`
- Kafka: `9092`
- pgAdmin: `5050` (เข้าผ่านเบราว์เซอร์เพื่อจัดการ DB)

---

## 2. ตั้งค่า Environment Variables (ที่ Root)
1. คัดลอกไฟล์ตัวอย่างไปเป็นไฟล์จริง (ทำที่โฟลเดอร์นอกสุดของโปรเจกต์):
   ```bash
   cd ..
   cp j-ledger-core/.env.local.example .env
   ```
2. แก้ไขไฟล์ `.env` หากต้องการเปลี่ยนรหัสผ่านหรือพอร์ต (ค่าเริ่มต้นถูกตั้งเป็น `localhost` ไว้แล้ว)

---

## 3. การจัดการ Database Migration (สำคัญ)
เนื่องจากเราปิด Auto-Migration ในแอปหลักไปแล้ว หากคุณรัน Service บนเครื่อง (Host) คุณต้องสั่ง Migration เองหนึ่งครั้งก่อนรันแอป:

```bash
# ทำที่โฟลเดอร์นอกสุด (Root)
docker compose up core-migration admin-migration
```

---

## 4. วิธีการรัน Services (ลำดับความสำคัญ)
ให้รัน Services ตามลำดับดังนี้เพื่อให้ระบบเชื่อมต่อกันได้สมบูรณ์:

### ขั้นที่ 1: Eureka Server (สำคัญมาก)
ต้องรันตัวนี้ตัวแรกเพื่อให้ Service อื่นๆ มาลงทะเบียนได้
```bash
cd j-ledger-core/eureka-server
mvn spring-boot:run
```

### ขั้นที่ 2: API Gateway
```bash
cd j-ledger-core/api-gateway
mvn spring-boot:run
```

### ขั้นที่ 3: Core Service & Notification
รันในเทอร์มินัลแยกกัน:
```bash
# Core Service
cd j-ledger-core/core-service
mvn spring-boot:run

# Notification Service
cd j-ledger-core/notification-service
mvn spring-boot:run
```

### ขั้นที่ 4: Frontend Portal
รันผ่านเครื่องมือ Turbo ในโฟลเดอร์หลักของ Portal:
```bash
cd j-ledger-portal
npm install      # ทำครั้งแรก
npm run dev
```

---

## 5. การตรวจสอบระบบ
- **Eureka Dashboard**: เข้าได้ที่ [http://localhost:8761](http://localhost:8761) (ควรเห็นทุก Service ขึ้นสถานะ UP)
- **API Swagger**: เข้าได้ที่ [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) (สำหรับ Core Service)
- **Frontend**: เข้าได้ที่ [http://localhost:3000](http://localhost:3000)

---

> [!TIP]
> **Hot Reload**: เมื่อรันผ่าน IDE หรือ Maven ตัวระบบจะตรวจจับการเปลี่ยนแปลงของไฟล์ Java และ Restart ตัวเองโดยอัตโนมัติ (ขอบคุณ `spring-boot-devtools`)
