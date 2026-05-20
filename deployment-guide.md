# 🚀 คู่มือการ Deploy J-Ledger บน AWS EC2 (Ubuntu 24.04)

**Domain:** `potayyr.site`

คู่มือนี้สำหรับติดตั้งระบบทั้งหมดลงในเครื่องเดียวโดยใช้ Docker Compose และ Nginx เป็น Reverse Proxy

---

## 🏗️ 1. เตรียม AWS Security Groups

ก่อนเริ่มงาน ให้ไปที่ AWS Console และตั้งค่า **Inbound Rules** (กฎขาเข้า) เพื่อเปิดทางให้ข้อมูลวิ่งเข้าเครื่องได้ดังนี้:

1.  ไปที่หน้า **EC2 Dashboard** > เลือกที่ **Security Groups** ของเครื่องคุณ
2.  คลิก **Edit inbound rules** และเพิ่มกฎดังนี้:
    - **SSH (Port 22)**: เลือก Source เป็น **"My IP"** (แนะนำเพื่อความปลอดภัยสูงสุด ให้เข้าได้เฉพาะคอมพิวเตอร์ของคุณ)
    - **HTTP (Port 80)**: เลือก Source เป็น **"Anywhere-IPv4"** (เพื่อให้คนทั่วไปเข้าดูเว็บได้)
    - **HTTPS (Port 443)**: เลือก Source เป็น **"Anywhere-IPv4"** (เพื่อให้เข้าเว็บแบบปลอดภัย SSL)
3.  กด **Save rules**

## 🔑 1.5 วิธีการ SSH เข้าเครื่อง AWS

การ SSH คือการ "รีโมท" เข้าไปควบคุมเครื่อง Ubuntu ผ่านหน้าจอ Terminal ของคุณ

1.  **เตรียมไฟล์ Key (.pem)**: คุณต้องมีไฟล์คีย์ที่โหลดมาจาก AWS (ในที่นี้คือ `j-ledger-key.pem`)
2.  **ตั้งค่า Permission ของคีย์**: (ทำบน Terminal ของเครื่อง Mac)
    ```bash
    chmod 400 j-ledger-key.pem
    ```
3.  **สั่งรีโมทเข้าไปในเครื่อง**:
    ```bash
    ssh -i "j-ledger-key.pem" ubuntu@<PUBLIC_IP_ของ_AWS>
    ```
    _ตัวอย่าง: `ssh -i "j-ledger-key.pem" ubuntu@13.250.xx.xx`_
4.  พิมพ์ `yes` หากมีการถามยืนยันการเชื่อมต่อครั้งแรก

**เมื่อเห็นคำว่า `ubuntu@ip-xxx:~$` แสดงว่าคุณ "วาร์ป" เข้าไปอยู่ในเครื่อง AWS เรียบร้อยแล้วครับ!**

---

## 🐧 2. ติดตั้ง Docker บน Ubuntu 24.04

เมื่อคุณอยู่ในเครื่อง AWS แล้ว ให้รันคำสั่งเหล่านี้ทีละชุด:

```bash
# 1. อัปเดตรายชื่อแพ็กเกจล่าสุดและอัปเกรดระบบให้เป็นปัจจุบัน
sudo apt update && sudo apt upgrade -y

# 2. ติดตั้งแอปพื้นฐานที่จำเป็นสำหรับการดึงข้อมูลจากอินเทอร์เน็ตผ่าน HTTPS
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg -y

# 3. สร้างโฟลเดอร์สำหรับเก็บกุญแจความปลอดภัย (GPG Key) ของ Docker
sudo install -m 0755 -d /etc/apt/keyrings

# 4. ดาวน์โหลด GPG Key ของแท้จาก Docker มาเก็บไว้เพื่อให้แน่ใจว่าไฟล์ที่โหลดมาปลอดภัย
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 5. เพิ่มที่อยู่แหล่งเก็บโปรแกรม (Repository) ของ Docker เข้าไปในระบบของ Ubuntu
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 6. อัปเดตรายการแพ็กเกจอีกครั้งเพื่อให้มองเห็นไฟล์ของ Docker ที่เราเพิ่งเพิ่มไป
sudo apt-get update

# 7. สั่งติดตั้งตัว Docker Engine, เครื่องมือ Command Line และปลั๊กอิน Docker Compose
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# 8. ตั้งค่าให้ User ปัจจุบัน (ubuntu) สามารถรันคำสั่ง Docker ได้โดยไม่ต้องพิมพ์ sudo นำหน้าเสมอ
sudo usermod -aG docker $USER
```

---

## 📁 3. นำโค้ดขึ้นเครื่อง (ผ่าน Git)

เครื่อง VM ในตอนแรกจะว่างเปล่า เราต้องนำโค้ดจากเครื่องเราเข้าไปตามวิธีนี้ครับ:

### วิธีที่แนะนำ: ใช้ Git Clone

1.  **สร้างโฟลเดอร์สำหรับเก็บแอป**:
    ```bash
    mkdir -p ~/app && cd ~/app
    ```
2.  **สั่ง Clone โปรเจกต์ (Repo เดียว)**:
    ```bash
    git clone https://github.com/wiiznu17/j-ledger.git
    cd j-ledger
    ```

---

## ⚙️ 4. ตั้งค่า Environment และเริ่มระบบ

หลังจากได้โค้ดมาแล้ว ให้ตั้งค่าไฟล์สำคัญดังนี้:

1.  **สร้างไฟล์ .env (แนะนำ: ใช้ script อัตโนมัติ)**:

```bash
cd ~/app/j-ledger
python3 generate-secrets.py
```

Script จะสร้างไฟล์ `.env` โดยอัตโนมัติ โดยสุ่ม key ที่ต้องการทั้งหมดให้เลย จากนั้นแก้ค่าที่เหลือด้วย `nano .env`

> [!IMPORTANT]
> **ต้องตั้งค่า Environment Variables ทั้งหมด** - ระบบจะไม่ทำงานถ้าขาดตัวแปรใดตัวแปรหนึ่ง

**ค่าที่ script สุ่มให้อัตโนมัติ** (ไม่ต้องทำเอง):
- `CUSTOMER_JWT_SECRET`, `CUSTOMER_REFRESH_SECRET`, `CUSTOMER_REGISTRATION_SECRET`
- `ADMIN_JWT_SECRET`, `ADMIN_REFRESH_SECRET`
- `PII_ENCRYPTION_KEY`, `JLEDGER_INTERNAL_SECRET`
- `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JLEDGER_ADMIN_PASSWORD`

**ต้องแก้ด้วยตัวเองหลัง script รัน:**
- `JLEDGER_ALLOWED_ORIGINS=https://potayyr.site,https://admin.potayyr.site` (ระบุ Origin ของเว็บหลัก และ Admin Panel บน Vercel คั่นด้วยคอมมา เพื่ออนุญาตให้ติดต่อกับ Portal Service ได้อย่างปลอดภัย)
- `JLEDGER_ADMIN_EMAIL` (อีเมลสำหรับ login admin ครั้งแรก)
- `POSTGRES_USER`, `POSTGRES_DB` (ถ้าต้องการเปลี่ยนจาก default)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (Email notifications)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` (ถ้าใช้ KYC จริง)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (ถ้าใช้ push notification)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (ถ้าใช้ Stripe)

2.  **เริ่มระบบ (Deployment)**:

````bash
docker compose up -d --build

_ระบบจะทำการรัน Migration อัตโนมัติ (ผ่าน finance-migration, portal-migration) ก่อนจะเริ่มแอปหลักครับ_
_ตรวจสอบสถานะด้วย `docker compose ps`_

---

## 5. Local Development Mode (Hybrid)

สำหรับการพัฒนาแบบ Hybrid (Infrastructure ใน Docker, Services บน Local):

1. **ตั้งค่า .env.local**:

```bash
cp .env.local.example .env.local
# แก้ค่าตามต้องการ (ส่วนใหญ่ใช้ค่า default ได้)
````

2. **เริ่ม Infrastructure**:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis kafka zookeeper pgadmin
```

3. **รัน Services บน Local**:

```bash
# Portal Service (Monolithic - contains identity, kyc, admin, integration, audit, reporting modules)
cd j-ledger-portal/apps/portal-service && npm run dev

# Finance Service (Java)
cd j-ledger-core/finance-service && ./mvnw spring-boot:run

# Notification Worker (NestJS)
cd j-ledger-portal/apps/notification-worker && npm run start:dev
```

> [!NOTE]
> Local services จะเชื่อมต่อ infrastructure ผ่าน localhost (ports exposed จาก docker-compose.dev.yml)

---

## 🗄️ 6. การจัดการ Database Migration

### โครงสร้าง Database

โปรเจ็คใช้ **PostgreSQL เดียว** (`jledger_db`) แต่แยก schema กัน:

| Service             | Schema        | Migration Tool |
| ------------------- | ------------- | -------------- |
| **finance-service** | `finance`     | Flyway (SQL)   |
| **portal-service**  | `identity`    | Prisma (ORM)   |
| **portal-service**  | `kyc`         | Prisma (ORM)   |
| **portal-service**  | `admin`       | Prisma (ORM)   |
| **portal-service**  | `integration` | Prisma (ORM)   |

### การรันครั้งแรก (Initial Deployment)

เมื่อรัน `docker compose up -d --build` ครั้งแรก ระบบจะทำ migration อัตโนมัติ:

- `finance-migration` container รัน Flyway → apply SQL migrations จาก `j-ledger-core/finance-service/src/main/resources/db/migration/`
- `portal-migration` container รัน Prisma → apply migrations สำหรับ identity, kyc, admin, integration schemas

Services หลักจะรอให้ migration เสร็จก่อนถึงจะเริ่มทำงาน

### เมื่อมีการแก้ Database

#### 1. Finance Service (Flyway)

```bash
# สร้าง migration file ใหม่
# ไฟล์: j-ledger-core/finance-service/src/main/resources/db/migration/V2__your_change.sql
# ระบุ schema ใน SQL: SET search_path TO finance, public;

# Deploy migration (Production)
docker compose up -d finance-migration

# Deploy migration (Dev - Docker)
docker compose -f docker-compose.yml -f docker-compose.dev.yml run --rm finance-migration
```

#### 2. Portal Service (Prisma)

```bash
# แก้ prisma/schema.prisma
cd j-ledger-portal/apps/portal-service

# สร้าง migration (Dev)
npx prisma migrate dev --name your_change

# Rebuild image และ deploy (Production)
docker compose build portal-migration
docker compose up -d portal-migration
```

### Workflow Summary

**แก้ database → generate migration → รัน migration container → รัน service**

> [!NOTE]
>
> - `prisma migrate deploy` ใช้ใน production (ไม่สร้าง migration ใหม่ แต่ apply เฉพาะที่มี)
> - `prisma migrate dev` ใช้ใน development (สร้าง migration ใหม่และ apply)

---

## 🔒 7. ตั้งค่า SSL (HTTPS) ด้วย Certbot (Standalone Mode)

เพื่อให้ป้องกันปัญหาพอร์ต 80 ชนกันระหว่าง Certbot และ Nginx ใน Docker เราจะใช้โหมด `standalone` ตามขั้นตอนที่ถูกต้องดังนี้ครับ:

1. **ติดตั้ง Certbot:**

   ```bash
   sudo apt install certbot -y
   ```

2. **หยุด Nginx ชั่วคราว (เพื่อคืนพอร์ต 80 ให้ Certbot):**

   ```bash
   cd ~/app/j-ledger
   docker compose stop nginx
   ```

3. **ขอใบรับรอง SSL:**

   ```bash
   sudo certbot certonly --standalone -d potayyr.site -d www.potayyr.site
   ```

   _กรอก Email และกดยอมรับเงื่อนไข ไฟล์ใบรับรองจะถูกเก็บไว้ที่ `/etc/letsencrypt/live/potayyr.site/`_

4. **เปิดการใช้งาน HTTPS ใน Nginx:**
   ใช้ตัวอย่างคอนฟิกสำหรับ Production และเปิดการใช้งาน SSL:

   ```bash
   # คัดลอกเทมเพลตสำหรับ Production
   cp docker/nginx/default.conf.prod docker/nginx/default.conf

   # แก้ไขเพื่อตรวจสอบความถูกต้อง (หากต้องการ)
   nano docker/nginx/default.conf
   ```

   - (ออปชั่น) หากในไฟล์เทมเพลตยังมีเครื่องหมาย `#` ปิดส่วน SSL ไว้ ให้เอาออกเพื่อให้ใช้งาน HTTPS ได้สมบูรณ์
   - (ออปชั่น) เอาเครื่องหมาย `#` ออกจากส่วน `return 301 https://...` ในพอร์ต 80 เพื่อบังคับใช้ HTTPS

5. **เริ่มการทำงาน Nginx อีกครั้ง:**
   ```bash
   docker compose up -d nginx
   ```

---

## 🔗 8. การเข้าใช้งานหลังติดตั้ง

### Production Mode

- **Web Portal:** `https://potayyr.site` (ล้างคุกกี้เบราว์เซอร์ก่อนเข้าครั้งแรกถ้าเคยเข้ามาก่อน)
- **Login:** ใช้ค่า `JLEDGER_ADMIN_EMAIL` และ `JLEDGER_ADMIN_PASSWORD` ที่ตั้งไว้ใน `.env`
- **Backend APIs:** ยิงผ่าน `https://potayyr.site/api/...`

### Local Development Mode

- **Portal Service:** `http://localhost:3000`
- **Finance Service:** `http://localhost:8081`
- **Notification Worker:** `http://localhost:3001`

> [!IMPORTANT]
> **Database Security**: สังเกตว่าพอร์ต 5432, 6379 จะไม่ถูกเปิดออกมาข้างนอกเครื่องใน production เพื่อป้องกันการเจาะระบบ ทุกอย่างสื่อสารกันภายใน Docker Network
