# 🚀 คู่มือการ Deploy J-Ledger บน AWS EC2 (Ubuntu 24.04)

**Domain:** `potayyr.site`

คู่มือนี้สำหรับติดตั้งระบบทั้งหมดในระดับ Production ลงในเครื่องเดียวโดยใช้ Docker Compose และ Nginx เป็น Reverse Proxy เพื่อรองรับทราฟฟิกและการทำงานที่มั่นคงปลอดภัย

---

## 🏗️ 1. เตรียม AWS Security Groups

ก่อนเริ่มงาน ให้ไปที่ AWS Console และตั้งค่า **Inbound Rules** (กฎขาเข้า) เพื่อเปิดทางให้ข้อมูลวิ่งเข้าเครื่องได้ดังนี้:

1. ไปที่หน้า **EC2 Dashboard** > เลือกที่ **Security Groups** ของเครื่องคุณ
2. คลิก **Edit inbound rules** และเพิ่มกฎดังนี้:
   - **SSH (Port 22)**: เลือก Source เป็น **"My IP"** (แนะนำเพื่อความปลอดภัยสูงสุด ให้เข้าได้เฉพาะคอมพิวเตอร์ของคุณ)
   - **HTTP (Port 80)**: เลือก Source เป็น **"Anywhere-IPv4"** (เพื่อให้คนทั่วไปเข้าดูเว็บได้)
   - **HTTPS (Port 443)**: เลือก Source เป็น **"Anywhere-IPv4"** (เพื่อให้เข้าเว็บแบบปลอดภัย SSL)
3. กด **Save rules**

## 🔑 1.5 วิธีการ SSH เข้าเครื่อง AWS

การ SSH คือการ "รีโมท" เข้าไปควบคุมเครื่อง Ubuntu ผ่านหน้าจอ Terminal ของคุณ

1. **เตรียมไฟล์ Key (.pem)**: คุณต้องมีไฟล์คีย์ที่โหลดมาจาก AWS (ในที่นี้คือ `j-ledger-key.pem`)
2. **ตั้งค่า Permission ของคีย์**: (ทำบน Terminal ของเครื่อง Mac)
   ```bash
   chmod 400 j-ledger-key.pem
   ```
3. **สั่งรีโมทเข้าไปในเครื่อง**:
   ```bash
   ssh -i "j-ledger-key.pem" ubuntu@<PUBLIC_IP_ของ_AWS>
   ```
   _ตัวอย่าง: `ssh -i "j-ledger-key.pem" ubuntu@13.250.xx.xx`_
4. พิมพ์ `yes` หากมีการถามยืนยันการเชื่อมต่อครั้งแรก

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

1. **สร้างโฟลเดอร์สำหรับเก็บแอป**:
   ```bash
   mkdir -p ~/app && cd ~/app
   ```
2. **สั่ง Clone โปรเจกต์ (Repo เดียว)**:
   ```bash
   git clone https://github.com/wiiznu17/j-ledger.git
   cd j-ledger
   ```

---

## ⚙️ 4. ตั้งค่า Environment และเริ่มระบบ

หลังจากได้โค้ดมาแล้ว ให้ตั้งค่าไฟล์สำคัญดังนี้:

1. **สร้างไฟล์ .env (แนะนำ: ใช้ script อัตโนมัติ)**:

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
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (สำหรับการส่งอีเมลแจ้งเตือนจริงในระบบ)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` (ถ้าใช้ KYC จริง)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (ถ้าใช้ Stripe)
- `POSTGRES_USER`, `POSTGRES_DB` (ถ้าต้องการเปลี่ยนจาก default)

> [!NOTE]
> ตัวแปร `JLEDGER_ADMIN_EMAIL` และ `JLEDGER_ADMIN_PASSWORD` ที่อยู่ในระบบ seed จะถูกใช้งาน**เฉพาะในโหมดพัฒนา/ทดสอบ (Non-Production)** เท่านั้น สำหรับโหมด Production ระบบจะเพิกเฉยและข้ามตัวแปรนี้เพื่อความปลอดภัย และท่านจะต้องสร้างบัญชี Admin แรกผ่าน **Admin CLI Tool** ตามข้อ 6

2. **เริ่มระบบ (Deployment)**:

```bash
docker compose up -d --build
```

_ระบบจะทำการรัน Migration อัตโนมัติ (ผ่าน `finance-migration` และ `portal-migration` containers) ก่อนจะเริ่มแอปหลักโดยไม่มีขั้นตอนยุ่งยากครับ_
_ตรวจสอบสถานะด้วย `docker compose ps`_

3. **ลงข้อมูลเริ่มต้นในระดับ Production (Production Seeding)**:

หลังจากระบบรันเรียบร้อยแล้ว ให้ทำการรันข้อมูลตั้งต้น (Seed) ที่เหมาะสมกับ Production โดยระบบจะเตรียมเฉพาะสิทธิ์ บทบาท (RBAC) และบัญชีระบบหลักที่จำเป็นเท่านั้น แต่จะข้ามบัญชีผู้พัฒนาและร้านค้าทดสอบเพื่อความปลอดภัย:

> [!IMPORTANT]
> **ทำไมต้องส่ง `NODE_ENV=production`?**
> หากรันตัว Seed โดยไม่มีการระบุ `NODE_ENV=production` ตัวสคริปต์ของ Prisma จะคิดว่ารันในโหมด Development และจะพยายามสร้างบัญชีผู้ใช้งานเริ่มต้น (`admin`) เข้าไปในตารางซึ่งอาจเกิดการชนกันของข้อมูลเดิมในฐานข้อมูล (Unique Constraint/Primary Key Collision) และส่งผลให้คอนเทนเนอร์แครชได้
> 
> ปัจจุบันเราได้เพิ่ม `environment: - NODE_ENV=${NODE_ENV}` เข้าไปในตาราง `portal-seed` ของไฟล์ `docker-compose.yml` เพื่อให้ดึงค่าจาก Host ได้อย่างสมบูรณ์แบบแล้ว

สามารถสั่งรันคำสั่งเหล่านี้ได้ตามรูปแบบสภาพแวดล้อมที่ใช้งาน:

* **สำหรับการรันแบบปกติ (Standard Compose):**
  ```bash
  NODE_ENV=production docker compose up portal-seed
  ```

* **สำหรับการรันในสภาพแวดล้อมทดสอบ (Test/Staging Compose ที่รันพอร์ต 80 ผ่าน ngrok):**
  ```bash
  NODE_ENV=production docker compose -f docker-compose.yml -f docker-compose.test.yml up portal-seed
  ```

หลังจากรัน Portal Seed เสร็จแล้ว ให้รัน SQL Seed ของระบบ **Finance Service** เพื่อตั้งค่าบัญชีภายในของระบบให้ยอดคงเหลือเริ่มต้นเป็น 0:
```bash
docker exec -i jledger-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} < j-ledger-core/finance-service/src/main/resources/db/seed/prod_seed.sql
```

---

## 🔒 5. ตั้งค่า SSL (HTTPS) ด้วย Certbot (Standalone Mode)

เพื่อป้องกันปัญหาพอร์ต 80 ชนกันระหว่าง Certbot และ Nginx ใน Docker เราจะใช้โหมด `standalone` ตามขั้นตอนที่ถูกต้องดังนี้ครับ:

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

## 🗄️ 6. การจัดการ Database Migration (Production)

### โครงสร้าง Database

โปรเจกต์ใช้ **PostgreSQL เดียว** (`jledger_db`) แต่แยก schema กันตามโมดูล:

| Service | Schema | Migration Tool |
| :--- | :--- | :--- |
| **finance-service** | `finance` | Flyway (SQL) |
| **portal-service** | `identity` | Prisma (ORM) |
| **portal-service** | `kyc` | Prisma (ORM) |
| **portal-service** | `admin` | Prisma (ORM) |
| **portal-service** | `integration` | Prisma (ORM) |

### การรันครั้งแรก (Initial Deployment)

เมื่อรัน `docker compose up -d --build` ครั้งแรก ระบบจะทำ migration อัตโนมัติผ่าน Migration Containers:
- `finance-migration` container รัน Flyway → apply SQL migrations จาก `j-ledger-core/finance-service/src/main/resources/db/migration/`
- `portal-migration` container รัน Prisma → apply migrations สำหรับ identity, kyc, admin, integration schemas

### เมื่อมีการอัปเดต Schema ใน Production

#### 1. อัปเดต Finance Service (Flyway)
เมื่อมีการเพิ่มไฟล์ migration ใหม่ (เช่น `V2__xxx.sql` ใน `j-ledger-core/finance-service/src/main/resources/db/migration/` โดยต้องระบุ `SET search_path TO finance, public;` ไว้ที่หัวไฟล์) ให้สั่งรัน migration container บน EC2:
```bash
docker compose up -d finance-migration
```

#### 2. อัปเดต Portal Service (Prisma)
เมื่อทำการเพิ่ม Prisma Migration ใหม่บนเครื่อง local เรียบร้อยแล้ว ให้ดึงโค้ดเวอร์ชันล่าสุดมาที่เครื่อง EC2 จากนั้นทำการ rebuild และ deploy ตัว migration container:
```bash
docker compose build portal-migration
docker compose up -d portal-migration
```

---

## 🔗 7. การเข้าใช้งานหลังติดตั้ง (Production Access)

- **Web Portal:** `https://potayyr.site`
- **Login:** ในโหมด Production จะไม่มีการสร้างบัญชี Admin เริ่มต้นผ่าน Seed Script เพื่อความปลอดภัยสูงสุด ท่านต้องทำการสร้างบัญชีแรกที่เป็น `SUPER_ADMIN` ด้วยตัวเองผ่าน **Admin CLI Tool** ภายใน Container (ดูคู่มือแบบละเอียดใน [ADMIN_SETUP.md](file:///Users/wiiznu/project/fintech/docs/ADMIN_SETUP.md)):
  ```bash
  docker exec -it jledger-portal node dist/src/cli/create-admin.js <username> <password> <email>
  ```
  _ตัวอย่าง:_
  ```bash
  docker exec -it jledger-portal node dist/src/cli/create-admin.js admin "MySecurePassword123!" admin@potayyr.site
  ```
  เมื่อสร้างสำเร็จแล้ว ให้เข้าสู่ระบบด้วยบัญชีดังกล่าวผ่านหน้าเว็บ
- **Backend APIs:** ติดต่อผ่าน `https://potayyr.site/api/...`

> [!IMPORTANT]
> **Database & Infrastructure Security**: ในโหมด Production สังเกตว่าพอร์ตฐานข้อมูลและระบบภายใน เช่น PostgreSQL (5432) หรือ Redis (6379) จะไม่ถูกเปิดออกภายนอกเครื่องเลย ทุกบริการจะสื่อสารกันภายในระบบปิดของ Docker Network เพื่อป้องกันการเจาะระบบและการโจมตีจากภายนอก 100%
