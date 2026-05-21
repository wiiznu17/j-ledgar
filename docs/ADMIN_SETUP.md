# 🛡️ คู่มือการตั้งค่าบัญชี Admin คนแรกในระบบ (Production Setup)

ในระบบ **J-Ledger** โหมด Production จะไม่มีการสร้างบัญชีผู้ดูแลระบบ (Admin User) ผ่านการรัน Seed Script อัตโนมัติ เพื่อความปลอดภัยสูงสุดและป้องกันการรั่วไหลของรหัสผ่านเริ่มต้น ดังนั้นคุณจะต้องสร้างบัญชีผู้ดูแลระบบคนแรกที่มีบทบาทเป็น `SUPER_ADMIN` ด้วยตัวเองตามขั้นตอนในเอกสารนี้

---

## 🚀 วิธีที่แนะนำและปลอดภัยที่สุด: Admin CLI Tool (Highly Recommended)

วิธีการใช้งาน CLI Tool เป็นวิธีมาตรฐานที่เป็นทางการและปลอดภัยที่สุด เนื่องจากไม่ต้องยิง HTTP endpoint ชั่วคราว และไม่ต้องเขียนคำสั่ง SQL ดิบลงใน Database โดยตรง

### 1. วิธีสร้าง Admin ในโหมด Production (ผ่าน Docker Container)

รันคำสั่งด้านล่างนี้บนเครื่อง Production Server โดยระบุ `<username>`, `<password>`, และ `<email>` ที่คุณต้องการ:

```bash
docker exec -it jledger-portal node dist/src/cli/create-admin.js <username> <password> <email>
```

**ตัวอย่างเช่น:**
```bash
docker exec -it jledger-portal node dist/src/cli/create-admin.js admin "MySecurePassword123!" admin@potayyr.site
```

ระบบจะทำการ:
1. เชื่อมต่อฐานข้อมูล PostgreSQL โดยตรงภายในเครือข่าย Docker Network อย่างปลอดภัย
2. ตรวจสอบว่ามีผู้ใช้นี้อยู่แล้วหรือไม่ (ป้องกันการสร้างซ้ำ)
3. เข้ารหัสผ่านด้วยฟังก์ชัน `bcryptjs`
4. สร้างบัญชีผู้ใช้ในตาราง `staffs` และกำหนดบทบาท `SUPER_ADMIN` ให้โดยอัตโนมัติ

---

### 2. วิธีใช้งานในโหมดพัฒนา (Local Development)

หากคุณกำลังพัฒนาแอปในโหมด Local Hybrid หรือต้องการทดสอบ CLI:

```bash
# ย้ายไปที่โฟลเดอร์ portal-service
cd j-ledger-portal/apps/portal-service

# รันสคริปต์ผ่าน tsx
npx tsx src/cli/create-admin.ts <username> <password> <email>

# หรือใช้ npm script ที่เตรียมไว้
npm run create-admin -- <username> <password> <email>
```

---

## ⚠️ วิธีสำรอง: Manual Database Insertion (กรณีฉุกเฉินเท่านั้น)

> [!WARNING]
> วิธีการด้านล่างนี้จัดทำไว้เป็นทางเลือก/กรณีฉุกเฉินเท่านั้น ไม่แนะนำให้ใช้เป็นวิธีหลักในสภาพแวดล้อมจริง (Production) แนะนำให้ใช้ **Admin CLI Tool** เป็นหลัก

การแทรกข้อมูลลงใน PostgreSQL โดยตรงด้วยคำสั่ง SQL ต้องทำด้วยความระมัดระวังเป็นพิเศษ เนื่องจากใช้ระบบแยก Schema และมีข้อจำกัดเรื่องบทบาท (RBAC) หากจำเป็นต้องทำ ให้ปฏิบัติตามขั้นตอนดังนี้:

### ขั้นตอนที่ 1: เชื่อมต่อ PostgreSQL
```bash
docker exec -it jledger-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

### ขั้นตอนที่ 2: สร้าง Password Hash
คุณต้องเข้ารหัสผ่านล่วงหน้าด้วย `bcryptjs` ห้ามใส่รหัสผ่านที่เป็นข้อความธรรมดา (Plain Text) ลงในฐานข้อมูลเด็ดขาด:
```bash
docker exec -it jledger-portal node -e "console.log(require('bcryptjs').hashSync('YOUR_SECURE_PASSWORD', 10))"
```

### ขั้นตอนที่ 3: แทรกข้อมูลลงในฐานข้อมูล
ใน J-Ledger ตารางสำหรับระบบผู้ดูแลระบบจะอยู่ใน schema `admin` และมีการใช้ชื่อตารางแบบพหูพจน์ คอลัมน์บางตัวมีความละเอียดอ่อนในเรื่องตัวอักษรเล็ก-ใหญ่ (Case-sensitive) ให้รันคำสั่ง SQL ด้านล่างนี้:

```sql
-- 1. สลับไปใช้งาน schema 'admin' และ 'public'
SET search_path TO admin, public;

-- 2. แทรกข้อมูลผู้ใช้งานในตาราง staffs (สุ่ม UUID แอดมิน หรือพิมพ์เป็นค่าใดค่าหนึ่งขึ้นมาเอง เช่น '00000000-0000-0000-0000-000000000001')
INSERT INTO staffs (id, username, password, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  '$2a$10$YOUR_HASHED_PASSWORD_HERE', -- แทนที่ด้วย Hash ที่ได้จากขั้นตอนที่ 2
  'admin@potayyr.site',
  'System',
  'Admin',
  true,
  NOW(),
  NOW()
);

-- 3. แทรกข้อมูลเพื่อเชื่อมโยงบทบาทในตาราง staff_roles (สุ่ม UUID สำหรับ ID และดึง ID ของบทบาท SUPER_ADMIN อัตโนมัติ)
INSERT INTO staff_roles (id, "staffId", "roleId", "createdAt")
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001', -- อ้างอิง ID ของ staffs ด้านบน
  (SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1),
  NOW()
);
```

---

## 🔒 แนวทางปฏิบัติด้านความปลอดภัยหลังการตั้งค่า (Post-Setup Security)

1. **เปลี่ยนรหัสผ่านทันที (Password Rotation):** หลังจากล็อกอินเข้าสู่ Web Portal สำเร็จในครั้งแรก ให้ทำการเปลี่ยนรหัสผ่านเป็นรหัสผ่านส่วนตัวที่ปลอดภัยทันที
2. **สร้างบัญชีบุคคลแยก (Individual Accounts):** สำหรับการทำงานประจำวันของทีมงานคนอื่นๆ ให้สร้างบัญชีแยกรายคนผ่านทางเมนู **Staff Management** บน Admin Dashboard และกำหนดสิทธิ์ (RBAC) ให้เหมาะสมตามหน้าที่ หลีกเลี่ยงการใช้บัญชีสิทธิ์สูงสุด `SUPER_ADMIN` ร่วมกันหลายคน
3. **ตรวจสอบสิทธิ์ในตาราง:** คุณสามารถตรวจสอบผู้ที่มีสิทธิ์ดูแลระบบทั้งหมดได้ผ่านการใช้คำสั่งคิวรี SQL ตรวจสอบตาราง `staffs` และ `staff_roles` อย่างสม่ำเสมอเพื่อความปลอดภัยของระบบ
