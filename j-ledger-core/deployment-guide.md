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
    *ตัวอย่าง: `ssh -i "j-ledger-key.pem" ubuntu@13.250.xx.xx`*
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
1.  **สร้างโฟลเดอร์สำหรับเก็บแอป**:
    ```bash
    mkdir -p ~/app && cd ~/app
    ```
2.  **สั่ง Clone โปรเจกต์ (Repo เดียว)**:
    ```bash
    git clone https://github.com/wiiznu17/j-ledgar.git
    cd j-ledgar
    ```

---

## ⚙️ 4. ตั้งค่า Environment และเริ่มระบบ
หลังจากได้โค้ดมาแล้ว ให้ตั้งค่าไฟล์สำคัญดังนี้:

1.  **ตั้งค่า .env**:
   ```bash
   cd ~/app/j-ledger/j-ledger-core
   cp .env.prod.example .env
   nano .env
   ```
   **แก้ไขค่าสำคัญใน `.env`:**
   - `JLEDGER_ALLOWED_ORIGINS=https://potayyr.site`
   - `INTERNAL_API_URL=http://admin-api:3001` (ทางด่วนสำหรับ Server คุยกันเอง)
   - `POSTGRES_PASSWORD`, `REDIS_PASSWORD` (เปลี่ยนให้ยากๆ)
   - `JLEDGER_ADMIN_EMAIL=admin@jledger.com` (อีเมลแอดมินเริ่มต้น)
   - `JLEDGER_ADMIN_PASSWORD=Admin@123` (รหัสผ่านแอดมินเริ่มต้น)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` (ใส่รหัสลับสุ่มที่ปลอดภัยสำหรับ Token)
   - `JLEDGER_INTERNAL_SECRET` (ใส่รหัสลับสุ่มที่ปลอดภัยสำหรับการคุยภายใน)

2.  **เริ่มระบบ (Deployment)**:
   ```bash
   docker compose up -d --build
   ```
   *ระบบจะทำการตรวจสอบฐานข้อมูลและสร้าง User Admin ให้เองโดยอัตโนมัติในครั้งแรกครับ*
   *ตรวจสอบสถานะด้วย `docker compose ps`*

---

## 🔒 5. ตั้งค่า SSL (HTTPS) ด้วย Certbot (Standalone Mode)
เพื่อให้ป้องกันปัญหาพอร์ต 80 ชนกันระหว่าง Certbot และ Nginx ใน Docker เราจะใช้โหมด `standalone` ตามขั้นตอนที่ถูกต้องดังนี้ครับ:

1. **ติดตั้ง Certbot:**
   ```bash
   sudo apt install certbot -y
   ```

2. **หยุด Nginx ชั่วคราว (เพื่อคืนพอร์ต 80 ให้ Certbot):**
   ```bash
   cd ~/app/j-ledgar/j-ledger-core
   docker compose stop nginx
   ```

3. **ขอใบรับรอง SSL:**
   ```bash
   sudo certbot certonly --standalone -d potayyr.site -d www.potayyr.site
   ```
   *กรอก Email และกดยอมรับเงื่อนไข ไฟล์ใบรับรองจะถูกเก็บไว้ที่ `/etc/letsencrypt/live/potayyr.site/`*

4. **เปิดการใช้งาน HTTPS ใน Nginx:**
   แก้ไขไฟล์ `nginx/default.conf`:
   ```bash
   nano nginx/default.conf
   ```
   - เอาเครื่องหมาย `#` ออกจากส่วนของ `server { listen 443 ssl; ... }`
   - (ออปชั่น) เอาเครื่องหมาย `#` ออกจากส่วน `return 301 https://...` ในพอร์ต 80 เพื่อบังคับใช้ HTTPS

5. **เริ่มการทำงาน Nginx อีกครั้ง:**
   ```bash
   docker compose up -d nginx
   ```

---

## 🔗 6. การเข้าใช้งานหลังติดตั้ง
- **Web Portal:** `https://potayyr.site` (ล้างคุกกี้เบราว์เซอร์ก่อนเข้าครั้งแรกถ้าเคยเข้ามาก่อน)
- **Login:** `admin@jledger.com` / `Admin@123`
- **Backend APIs:** ยิงผ่าน `https://potayyr.site/api/...`

> [!IMPORTANT]
> **Database Security**: สังเกตว่าพอร์ต 5432, 6379 จะไม่ถูกเปิดออกมาข้างนอกเครื่อง เพื่อป้องกันการเจาะระบบ ทุกอย่างสื่อสารกันภายใน Docker Network
