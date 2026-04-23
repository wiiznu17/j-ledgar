# Admin Auth Service

Staff IAM (Identity and Access Management) service for J-Ledger admin portal.

## Features

- Staff authentication with JWT
- Role-Based Access Control (RBAC)
- Permission management
- Password hashing with bcrypt

## Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL
- JWT (Passport)

## Database Schema

- `Staff` - Staff accounts
- `Role` - User roles
- `Permission` - Granular permissions
- `StaffRole` - Staff-Role junction
- `RolePermission` - Role-Permission junction

## API Endpoints

- `POST /auth/login` - Staff login
- `GET /auth/profile` - Get current staff profile
- `POST /staff` - Create staff
- `GET /staff/:id` - Get staff by ID
- `POST /role` - Create role
- `GET /role/:id` - Get role by ID
- `POST /permission` - Create permission
- `GET /permission/:id` - Get permission by ID

## Environment Variables

- `PORT` - Service port (default: 3005)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - JWT secret key

## Development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Docker

```bash
docker build -t j-ledger/admin-auth-service .
docker run -p 3005:3005 j-ledger/admin-auth-service
```
