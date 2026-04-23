# User KYC Service

PII (Personally Identifiable Information) and KYC (Know Your Customer) verification service.

## Features

- Document upload to S3
- KYC status tracking
- PII encryption (AES-256-GCM)
- Document approval/rejection workflow

## Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL
- AWS S3

## Database Schema

- `User` - User accounts
- `KYCDocument` - KYC documents
- `PII` - Encrypted PII data

## API Endpoints

- `GET /kyc/status/:userId` - Get KYC status
- `POST /kyc/approve/:documentId` - Approve document
- `POST /kyc/reject/:documentId` - Reject document
- `POST /documents/upload/:userId/:documentType` - Upload document
- `GET /documents/user/:userId` - Get user documents
- `POST /pii/store/:userId` - Store encrypted PII
- `GET /pii/get/:userId/:field` - Get decrypted PII
- `DELETE /pii/delete/:userId/:field` - Delete PII

## Environment Variables

- `PORT` - Service port (default: 3004)
- `DATABASE_URL` - PostgreSQL connection string
- `AWS_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET` - S3 bucket name
- `PII_ENCRYPTION_KEY` - 32-byte encryption key

## Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Docker

```bash
docker build -t j-ledger/user-kyc-service .
docker run -p 3004:3004 j-ledger/user-kyc-service
```
