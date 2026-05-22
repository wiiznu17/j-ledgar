# 🚀 คู่มือการ Deploy J-Ledger บน AWS EC2 (Ubuntu 24.04)

**Service API Domain (EC2):** `api.potayyr.site`

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
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
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

## ⚙️ 4. ตั้งค่า Environment และขอใบรับรอง SSL (HTTPS)

ก่อนที่จะเริ่มรันระบบใน Docker เราต้องตั้งค่าสภาพแวดล้อม (.env) และขอใบรับรองความปลอดภัย SSL ให้เรียบร้อยเสียก่อน (การทำ SSL ก่อนเริ่มระบบช่วยแก้ปัญหา Nginx คอนเทนเนอร์แครชเนื่องจากหาใบรับรองไม่เจอได้ 100%)

### 4.1 สร้างไฟล์ .env
1. **รันสคริปต์สุ่ม Secrets อัตโนมัติ**:
   ```bash
   cd ~/app/j-ledger
   python3 generate-secrets.py
   ```
   _สคริปต์จะคัดลอกตัวอย่างจาก `.env.example` ไปสร้างเป็น `.env` และสุ่ม Key/Password ที่จำเป็นทั้งหมดให้ท่านโดยอัตโนมัติ_

2. **แก้ไขการตั้งค่าเพิ่มเติม**:
   เปิดไฟล์ `.env` ด้วย nano เพื่อใส่ค่าบริการภายนอก:
   ```bash
   nano .env
   ```
   **ค่าสำคัญที่ต้องตรวจสอบและระบุเอง:**
   - `NODE_ENV=production` (สคริปต์สุ่มจะใส่ค่านี้เป็นค่าเริ่มต้นแล้ว เพื่อระบุโหมดการรันแบบ Production)
   - `JLEDGER_ALLOWED_ORIGINS=https://potayyr.site,https://admin.potayyr.site` (เพื่อความปลอดภัยสูงสำหรับระบบ CORS)
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` (สำหรับการส่งอีเมลแจ้งเตือนจริงในระบบ)
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME` (สำหรับบริการ KYC/Face Liveness)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (สำหรับระบายธุรกรรม/การชำระเงินผ่านบัตร)

### 4.2 ขอใบรับรอง SSL ด้วย Certbot (ก่อนเริ่ม Docker)
เนื่องจากการทำงานของ Nginx ใน Docker ถูกตั้งค่าให้รับเฉพาะ HTTPS (SSL) บนพอร์ต 443 เราจึงจำเป็นต้องขอใบรับรอง SSL จาก Let's Encrypt มาอยู่ในเครื่องก่อนเริ่มแอปพลิเคชัน:

1. **ติดตั้ง Certbot ลงบน Ubuntu Host**:
   ```bash
   sudo apt install certbot -y
   ```

2. **ขอใบรับรอง SSL ในโหมด Standalone**:
   รันคำสั่งด้านล่าง (ตรวจสอบว่าไม่มีแอปอื่นใช้พอร์ต 80 อยู่ขณะรัน):
   ```bash
   sudo certbot certonly --standalone -d api.potayyr.site
   ```
   _หมายเหตุ: การขอใบรับรองสำหรับโดเมน `api.potayyr.site` จะทำให้ Let's Encrypt บันทึกไฟล์ใบรับรองไว้ที่ `/etc/letsencrypt/live/api.potayyr.site/` ซึ่งจะตรงกับการตั้งค่าของ Nginx ของเราพอดี (สำหรับโดเมน `potayyr.site` และ `admin.potayyr.site` จะมีระบบจัดการ SSL อัตโนมัติจากฝั่งผู้ให้บริการโฮสติ้ง เช่น Vercel อยู่แล้ว จึงไม่ต้องขอใบรับรองจากเครื่อง EC2 เครื่องนี้)_

---

## 🚀 5. เริ่มต้นระบบและใส่ข้อมูลตั้งต้น (Seeding)

เมื่อเตรียม `.env` และใบรับรอง SSL เรียบร้อยแล้ว สามารถสั่งเริ่มระบบทั้งหมดได้ทันที:

### 5.1 เริ่มระบบทั้งหมด (Deployment)
```bash
docker compose up -d --build
```
- ระบบจะดาวน์โหลด อัปเดต และคอมไพล์โค้ดใน Docker Network แบบปิด
- ในขั้นตอนนี้ **Nginx จะสามารถเริ่มทำงานได้ทันทีและไร้ข้อผิดพลาด** เนื่องจากตรวจพบไฟล์ SSL ของท่านที่สร้างไว้ก่อนหน้านี้
- ตัว Migration Containers (`finance-migration` และ `portal-migration`) จะทำการอัปเดตและสร้างโครงสร้าง Schema ใหม่ลงในฐานข้อมูลให้ทันที
- ตรวจสอบความถูกต้องและสถานะการทำงานด้วย `docker compose ps`

### 5.2 รันข้อมูลตั้งต้นในระดับ Production (Production Seeding)

หลังระบบรันเรียบร้อยแล้ว ให้ทำการรันข้อมูลตั้งต้น (Seed) ที่เหมาะสมกับระดับ Production เพื่อให้ระบบตั้งค่าโครงสร้างสิทธิ์ บทบาท (RBAC) และบัญชีระบบหลักที่จำเป็น:

* **สำหรับการรันแบบปกติ (Standard Compose):**
  ```bash
  docker compose up portal-seed
  ```
  _(เนื่องจากเรากำหนด `NODE_ENV=production` ลงใน `.env` เรียบร้อยแล้ว ตัว Seed Script จะทราบและไม่สร้างบัญชี Admin ทดสอบที่จะทำให้เกิด Primary Key Collision หรือลดความปลอดภัยลง)_

* **สำหรับการรันในสภาพแวดล้อม Staging/Test (ใช้ docker-compose.test.yml):**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.test.yml up portal-seed
  ```

หลังจากรัน Portal Seed สำเร็จแล้ว ให้ทำการรัน SQL Seed สำหรับระบบ **Finance Service** เพื่อตั้งค่าบัญชีระบบภายใน (Double-entry Clearing Account) ให้ยอดคงเหลือเริ่มต้นเป็น 0:

```bash
docker exec -i jledger-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < j-ledger-core/finance-service/src/main/resources/db/seed/prod_seed.sql
```
_(หมายเหตุ: คำสั่งนี้จะใช้บริการเชลล์ภายใน Container เป็นตัวแปลงค่ารหัสผ่านและชื่อผู้ใช้ ช่วยให้มั่นใจได้ว่าคำสั่งทำงานได้ทันทีโดยไม่ต้อง Export ตัวแปรบนเครื่อง Host เสมือน)_

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

- **Service APIs (EC2):** `https://api.potayyr.site`
- **Admin Web Portal (Vercel):** `https://admin.potayyr.site` (ตั้งค่าใน Vercel ให้ยิงมาที่ `https://api.potayyr.site`)
- **Landing Page (ในอนาคต):** `https://potayyr.site`
- **Login:** ในโหมด Production จะไม่มีการสร้างบัญชี Admin เริ่มต้นผ่าน Seed Script เพื่อความปลอดภัยสูงสุด ท่านต้องทำการสร้างบัญชีแรกที่เป็น `SUPER_ADMIN` ด้วยตัวเองผ่าน **Admin CLI Tool** ภายใน Container (ดูคู่มือแบบละเอียดใน [ADMIN_SETUP.md](file:///Users/wiiznu/project/fintech/docs/ADMIN_SETUP.md)):
  ```bash
  docker exec -it jledger-portal node dist/src/cli/create-admin.js <username> <password> <email>
  ```
  _ตัวอย่าง:_
  ```bash
  docker exec -it jledger-portal node dist/src/cli/create-admin.js admin "MySecurePassword123!" admin@potayyr.site
  ```
  เมื่อสร้างสำเร็จแล้ว ให้เข้าสู่ระบบด้วยบัญชีดังกล่าวผ่านหน้าเว็บของ Admin Web (`https://admin.potayyr.site`)
- **Backend APIs:** ติดต่อผ่าน `https://api.potayyr.site/api/...`

> [!IMPORTANT]
> **Database & Infrastructure Security**: ในโหมด Production สังเกตว่าพอร์ตฐานข้อมูลและระบบภายใน เช่น PostgreSQL (5432) หรือ Redis (6379) จะไม่ถูกเปิดออกภายนอกเครื่องเลย ทุกบริการจะสื่อสารกันภายในระบบปิดของ Docker Network เพื่อป้องกันการเจาะระบบและการโจมตีจากภายนอก 100%
