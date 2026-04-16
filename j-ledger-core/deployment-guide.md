# 🚀 คู่มือการ Deploy J-Ledger บน AWS EC2 (Ubuntu 24.04)
**Domain:** `potayyr.site`

คู่มือนี้สำหรับติดตั้งระบบทั้งหมดลงในเครื่องเดียวโดยใช้ Docker Compose และ Nginx เป็น Reverse Proxy

---

## 🏗️ 1. เตรียม AWS Security Groups
ก่อนเริ่มงาน ให้ไปที่ AWS Console และตั้งค่า **Inbound Rules** ดังนี้:
- **SSH (22)**: สำหรับรีโมท (อนุญาตเฉพาะ IP ของคุณ)
- **HTTP (80)**: เปิดจากทั่วโลก (Anywhere)
- **HTTPS (443)**: เปิดจากทั่วโลก (Anywhere)

---

## 🐧 2. ติดตั้ง Docker บน Ubuntu 24.04
SSH เข้าเครื่อง AWS แล้วรันคำสั่งเหล่านี้:

```bash
# อัปเดตระบบ
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Docker ล่าสุดจาก Docker Repo
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# ให้รัน docker ได้โดยไม่ต้องพิมพ์ sudo (ต้อง logout/login ใหม่ถึงจะเห็นผล)
sudo usermod -aG docker $USER
```

---

## 📁 3. นำโค้ดขึ้นเครื่องและตั้งค่า Environment
1. นำไฟล์โปรเจกต์ (core และ portal) ไปไว้ที่ `/home/ubuntu/app/`
2. ตั้งค่าไฟล์ `.env`:
   ```bash
   cd /home/ubuntu/app/j-ledger-core
   cp .env.prod.example .env
   nano .env
   ```
   **แก้ไขค่าสำคัญใน `.env`:**
   - `JLEDGER_ALLOWED_ORIGINS=https://potayyr.site`
   - ตั้งค่า `POSTGRES_PASSWORD` และ `REDIS_PASSWORD` ให้ปลอดภัย
   - `JLEDGER_INTERNAL_SECRET` ให้ใช้รหัสผ่านสุ่มที่ยาวและปลอดภัย

---

## 🚢 4. เริ่มระบบ (Deployment)
รันคำสั่งเพื่อ Build และเริ่มระบบทั้งหมด:

```bash
docker compose up -d --build
```
*ตรวจสถานะด้วย `docker compose ps` ทุกตัวควรเป็น `healthy` หรือ `Up`*

---

## 🔒 5. ตั้งค่า SSL (HTTPS) ด้วย Certbot (Standalone Mode)
เพื่อป้องกันปัญหาพอร์ต 80 ชนกันระหว่าง Certbot และ Nginx ใน Docker เราจะใช้โหมด `standalone` ตามขั้นตอนที่ถูกต้องดังนี้ครับ:

1. **ติดตั้ง Certbot:**
   ```bash
   sudo apt install certbot -y
   ```

2. **หยุด Nginx ชั่วคราว (เพื่อคืนพอร์ต 80 ให้ Certbot):**
   ```bash
   cd /home/ubuntu/app/j-ledger-core
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
- **Web Portal:** `https://potayyr.site`
- **Backend APIs:** ยิงผ่าน `https://potayyr.site/api/...`

> [!IMPORTANT]
> **Database Security**: สังเกตว่าพอร์ต 5432, 6379 จะไม่ถูกเปิดออกมาข้างนอกเครื่อง เพื่อป้องกันการเจาะระบบ ทุกอย่างสื่อสารกันภายใน Docker Network
