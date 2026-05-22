# 📱 คู่มือ Deploy Wallet App (Expo React Native)

**Tech Stack:** Expo SDK 54 · React Native 0.81 · Expo Router · NativeWind  
**EAS Project ID:** `841c402f-b619-433d-b952-6fb29f34d0b6`

> wallet-app เป็น Mobile App ไม่ได้ deploy บน server  
> แต่ **build เป็น APK (Android) หรือ IPA (iOS)** แล้วแจกจ่ายให้ผู้ใช้โหลด

---

## 📋 สารบัญ

1. [Prerequisites](#1-prerequisites)
2. [ตั้งค่า Environment](#2-ตั้งค่า-environment)
3. [Local Development](#3-local-development)
4. [EAS Build (Internal Distribution)](#4-eas-build-internal-distribution)
5. [ขั้นตอน Production Build](#5-ขั้นตอน-production-build)
6. [Environment Variables อ้างอิง](#6-environment-variables-อ้างอิง)

---

## 1. Prerequisites

| เครื่องมือ | Version | ติดตั้ง                                              |
| ---------- | ------- | ---------------------------------------------------- |
| Node.js    | >= 20   | `brew install node`                                  |
| npm        | >= 10   | ติดมากับ Node.js                                     |
| EAS CLI    | latest  | `npm install -g eas-cli`                             |
| Expo Go    | latest  | โหลดจาก App Store / Play Store (สำหรับ dev เท่านั้น) |

```bash
# ตรวจสอบว่า login EAS แล้วหรือยัง
eas whoami

# ถ้ายัง login:
eas login
```

---

## 2. ตั้งค่า Environment

```bash
cd j-ledger-portal/apps/wallet-app
cp .env.example .env
```

แก้ไขค่าใน `.env`:

```env
# ชี้ไปที่ backend server จริง
EXPO_PUBLIC_API_URL=https://api.potayyr.site

# Stripe (ใช้ publishable key เท่านั้น — ห้าม secret key)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# AWS Cognito สำหรับ Face Liveness (KYC)
EXPO_PUBLIC_AWS_REGION=ap-southeast-1
EXPO_PUBLIC_AWS_IDENTITY_POOL_ID=ap-southeast-1:xxxx-xxxx-xxxx
```

> [!IMPORTANT]
> ตัวแปรที่ขึ้นต้นด้วย `EXPO_PUBLIC_` จะถูก **embed เข้าไปใน APK ตอน build**  
> ห้ามใส่ข้อมูลลับ (secret key, private key) ใน prefix นี้เด็ดขาด

---

## 3. Local Development

### วิธีที่ 1: รันกับ Backend ใน Docker (แนะนำ)

```bash
# 1. เริ่ม backend ใน Docker ก่อน (จาก root ของ project)
cd /path/to/j-ledger
docker compose up -d postgres redis kafka finance-service portal-service

# 2. แก้ .env ให้ชี้มาที่ IP เครื่องตัวเอง (ไม่ใช่ localhost เพราะ mobile ต่างเครื่อง)
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000   # IP ของ Mac ใน LAN

# 3. รัน Expo
cd j-ledger-portal/apps/wallet-app
npm install
npm run dev
```

### วิธีที่ 2: รันจาก Monorepo Root

```bash
cd j-ledger-portal
npx turbo run dev --filter=wallet-app
```

### เปิดแอปบนโทรศัพท์

หลัง `npm run dev` จะเห็น QR Code ใน Terminal:

- **Android**: เปิด Expo Go → Scan QR Code
- **iOS**: เปิดกล้อง → Scan QR Code → เปิดใน Expo Go

> [!NOTE]
> โทรศัพท์และคอมพิวเตอร์ต้องอยู่ใน **WiFi เดียวกัน**

---

## 4. EAS Build (Internal Distribution)

ใช้สำหรับแจกให้ทีม test โดยไม่ต้องขึ้น Store

### Android APK

```bash
cd j-ledger-portal/apps/wallet-app

# Build แบบ preview (APK — ติดตั้งได้โดยตรง)
eas build --profile preview --platform android
```

เมื่อ build เสร็จ EAS จะให้:

- **Link ดาวน์โหลด APK** → ส่ง link ให้ผู้ทดสอบโหลดเอง
- ดูทุก build ได้ที่ [expo.dev/accounts/wiiznu17/projects/wallet-app/builds](https://expo.dev)

### iOS (ต้องมี Apple Developer Account)

```bash
# Build สำหรับ TestFlight / Internal
eas build --profile preview --platform ios
```

> [!WARNING]
> iOS build ต้องมี **Apple Developer Account** ($99/ปี) และ **Certificate + Provisioning Profile**  
> EAS จัดการให้อัตโนมัติผ่าน `eas credentials`

### แจกผ่าน Internal Distribution Link

```bash
# ดู build ล่าสุดและ share link
eas build:list --limit 5
```

---

## 5. ขั้นตอน Production Build

### เช็ค `app.json` ก่อน build production

ใน [app.json](./app.json) ให้ตรวจสอบ:

- `version` — เพิ่มเลข version ก่อน build ทุกครั้ง
- `android.versionCode` — เพิ่มทีละ 1 ทุก release (ถ้ามี)
- `ios.buildNumber` — เพิ่มทีละ 1 ทุก release (ถ้ามี)

### Build สำหรับ Play Store / App Store

```bash
# Android (AAB — สำหรับ Play Store)
eas build --profile production --platform android

# iOS (IPA — สำหรับ App Store)
eas build --profile production --platform ios

# Build ทั้งคู่พร้อมกัน
eas build --profile production --platform all
```

### Submit ขึ้น Store

```bash
# Auto-submit หลัง build เสร็จ
eas submit --platform android
eas submit --platform ios
```

---

## 6. Environment Variables อ้างอิง

| ตัวแปร                               | ตัวอย่างค่า                      | หมายเหตุ                         |
| ------------------------------------ | -------------------------------- | -------------------------------- |
| `EXPO_PUBLIC_API_URL`                | `https://api.potayyr.site`       | URL ของ portal-service backend   |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` หรือ `pk_test_xxx` | **Publishable key เท่านั้น**     |
| `EXPO_PUBLIC_AWS_REGION`             | `ap-southeast-1`                 | AWS Region สำหรับ Face Liveness  |
| `EXPO_PUBLIC_AWS_IDENTITY_POOL_ID`   | `ap-southeast-1:xxxx`            | Cognito Identity Pool สำหรับ KYC |

### ตารางเปรียบเทียบค่าตาม Environment

|              | Local Dev                 | Staging                        | Production             |
| ------------ | ------------------------- | ------------------------------ | ---------------------- |
| `API_URL`    | `http://192.168.x.x:3000` | `https://staging.potayyr.site` | `https://api.potayyr.site` |
| `STRIPE_KEY` | `pk_test_xxx`             | `pk_test_xxx`                  | `pk_live_xxx`          |

---

## 🔗 Links ที่เกี่ยวข้อง

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Backend Deployment Guide](../../../../deployment-guide.md) — คู่มือ deploy EC2 (backend services)
- [Certificate Pinning](./CERTIFICATE_PINNING.md) — Security hardening สำหรับ production
