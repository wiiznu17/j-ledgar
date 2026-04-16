# 🛠️ คู่มือการรัน J-Ledger สำหรับ Local Development

คู่มือนี้สำหรับนักพัฒนาที่ต้องการรัน **Infrastructure ใน Docker** และรัน **Services (Java/Next.js) บนเครื่องตัวเอง (Host)** เพื่อความรวดเร็วในการ Debug และ Hot Reload

---

## 1. เตรียมระบบพื้นฐาน (Docker)
รัน Infrastructure ที่จำเป็น (Database, Redis, Kafka) โดยใช้คำสั่ง:

```bash
cd j-ledger-core
docker compose -f docker-compose.infra.yml up -d
```

**รายการพอร์ตที่เปิดใช้งานบน localhost:**
- Postgres: `5432`
- Redis: `6379`
- Kafka: `9092`
- pgAdmin: `5050` (เข้าผ่านเบราว์เซอร์เพื่อจัดการ DB)

---

## 2. ตั้งค่า Environment Variables
1. คัดลอกไฟล์ตัวอย่างไปเป็นไฟล์จริง:
   ```bash
   cp .env.local.example .env
   ```
2. แก้ไขไฟล์ `.env` หากต้องการเปลี่ยนรหัสผ่านหรือพอร์ต (ค่าเริ่มต้นถูกตั้งเป็น `localhost` ไว้แล้ว)

---

## 3. วิธีการรัน Services (ลำดับความสำคัญ)
ให้รัน Services ตามลำดับดังนี้เพื่อให้ระบบเชื่อมต่อกันได้สมบูรณ์:

### ขั้นที่ 1: Eureka Server (สำคัญมาก)
ต้องรันตัวนี้ตัวแรกเพื่อให้ Service อื่นๆ มาลงทะเบียนได้
```bash
cd eureka-server
mvn spring-boot:run
```

### ขั้นที่ 2: API Gateway
```bash
cd api-gateway
mvn spring-boot:run
```

### ขั้นที่ 3: Core Service & Notification
รันในเทอร์มินัลแยกกัน:
```bash
# Core Service
cd core-service
mvn spring-boot:run

# Notification Service
cd notification-service
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

## 4. การตรวจสอบระบบ
- **Eureka Dashboard**: เข้าได้ที่ [http://localhost:8761](http://localhost:8761) (ควรเห็นทุก Service ขึ้นสถานะ UP)
- **API Swagger**: เข้าได้ที่ [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html) (สำหรับ Core Service)
- **Frontend**: เข้าได้ที่ [http://localhost:3000](http://localhost:3000)

---

> [!TIP]
> **Hot Reload**: เมื่อรันผ่าน IDE หรือ Maven ตัวระบบจะตรวจจับการเปลี่ยนแปลงของไฟล์ Java และ Restart ตัวเองโดยอัตโนมัติ (ขอบคุณ `spring-boot-devtools`)
