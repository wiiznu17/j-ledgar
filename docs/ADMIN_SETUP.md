# Admin User Setup Guide (Production)

This guide explains how to set up the first admin user in production without using seed scripts.

## Why Not Use Seed Scripts in Production?

Seed scripts in production pose security risks:
- Hardcoded passwords or environment variables may leak
- Accidental password resets when re-running seeds
- Test data contamination in production database
- Lack of audit trail for admin account creation

## Setup Methods

### Method 1: Manual Database Insertion (Recommended for First Admin)

Use this method for the initial admin setup when no admin exists yet.

#### Step 1: Connect to PostgreSQL

```bash
# Using docker exec
docker exec -it jledger-postgres psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}

# Or using psql directly if port is exposed
psql -h localhost -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

#### Step 2: Verify No Admin Exists

```sql
-- Check if any admin staff exists
SELECT id, username, email, "firstName", "lastName", "isActive" 
FROM staff 
WHERE username = 'admin';
```

#### Step 3: Insert Admin User

First, generate a secure password hash:

```bash
# Using Node.js
node -e "console.log(require('bcryptjs').hashSync('YOUR_SECURE_PASSWORD', 10))"

# Or use the portal-service container
docker exec -it jledger-portal node -e "console.log(require('bcryptjs').hashSync('YOUR_SECURE_PASSWORD', 10))"
```

Then insert the admin user:

```sql
-- Insert admin staff user
INSERT INTO staff (username, password, email, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES (
  'admin',
  '$2a$10$YOUR_HASHED_PASSWORD_HERE', -- Replace with actual hash
  'admin@yourcompany.com', -- Replace with actual email
  'System',
  'Admin',
  true,
  NOW(),
  NOW()
);

-- Get the admin user ID
SELECT id FROM staff WHERE username = 'admin';
```

#### Step 4: Assign SUPER_ADMIN Role

```sql
-- Get SUPER_ADMIN role ID
SELECT id FROM roles WHERE name = 'SUPER_ADMIN';

-- Assign role to admin (replace ADMIN_ID and ROLE_ID with actual values)
INSERT INTO "staffRole" ("staffId", "roleId")
VALUES (ADMIN_ID, ROLE_ID);
```

#### Step 5: Verify Setup

```sql
-- Verify admin user with role
SELECT 
  s.username, 
  s.email, 
  s."isActive",
  r.name as role_name
FROM staff s
JOIN "staffRole" sr ON s.id = sr."staffId"
JOIN roles r ON sr."roleId" = r.id
WHERE s.username = 'admin';
```

### Method 2: Admin Setup API Endpoint

Create a dedicated admin setup endpoint that:
- Only works when no admin exists
- Requires a special setup token (one-time use)
- Creates the first admin with provided credentials
- Disables itself after first use

#### Implementation Example

Add to portal-service:

```typescript
// apps/portal-service/src/modules/admin/admin-setup.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { StaffService } from '../staff/staff.service';
import { PrismaService } from '../../core/prisma/prisma.service';

@Controller('admin/setup')
export class AdminSetupController {
  constructor(
    private staffService: StaffService,
    private prisma: PrismaService,
  ) {}

  @Post()
  async setupFirstAdmin(@Body() dto: SetupAdminDto) {
    // Check if setup token is valid
    if (dto.setupToken !== process.env.ADMIN_SETUP_TOKEN) {
      throw new BadRequestException('Invalid setup token');
    }

    // Check if admin already exists
    const existingAdmin = await this.prisma.staff.findUnique({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      throw new BadRequestException('Admin already exists');
    }

    // Create admin user
    const admin = await this.staffService.createStaff({
      username: 'admin',
      password: dto.password,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // Assign SUPER_ADMIN role
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });

    if (superAdminRole) {
      await this.prisma.staffRole.create({
        data: {
          staffId: admin.id,
          roleId: superAdminRole.id,
        },
      });
    }

    return { success: true, message: 'Admin setup completed' };
  }
}
```

#### Usage

```bash
# Generate a one-time setup token
export ADMIN_SETUP_TOKEN=$(openssl rand -hex 32)

# Call the setup endpoint
curl -X POST http://localhost:3000/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "setupToken": "'$ADMIN_SETUP_TOKEN'",
    "username": "admin",
    "password": "YourSecurePassword123!",
    "email": "admin@yourcompany.com",
    "firstName": "System",
    "lastName": "Admin"
  }'

# After successful setup, remove or invalidate the token
unset ADMIN_SETUP_TOKEN
```

### Method 3: Admin CLI Tool

Create a CLI command to create the first admin user.

#### Implementation

Add to portal-service:

```typescript
// apps/portal-service/src/cli/create-admin.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];
  const email = process.argv[4];

  if (!username || !password || !email) {
    console.log('Usage: npm run create-admin <username> <password> <email>');
    process.exit(1);
  }

  // Check if admin already exists
  const existing = await prisma.staff.findUnique({
    where: { username },
  });

  if (existing) {
    console.log('Admin user already exists');
    process.exit(1);
  }

  // Create admin
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await prisma.staff.create({
    data: {
      username,
      password: hashedPassword,
      email,
      firstName: 'System',
      lastName: 'Admin',
      isActive: true,
    },
  });

  // Assign SUPER_ADMIN role
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });

  if (superAdminRole) {
    await prisma.staffRole.create({
      data: {
        staffId: admin.id,
        roleId: superAdminRole.id,
      },
    });
  }

  console.log('Admin user created successfully');
  await prisma.$disconnect();
}

createAdmin();
```

#### Add to package.json

```json
{
  "scripts": {
    "create-admin": "tsx src/cli/create-admin.ts"
  }
}
```

#### Usage

```bash
# Run inside the portal-service container
docker exec -it jledger-portal npm run create-admin admin "SecurePass123!" admin@yourcompany.com
```

## Post-Setup Steps

After creating the first admin user:

1. **Change the password immediately** after first login
2. **Enable 2FA** if available
3. **Create additional admin accounts** through the admin interface
4. **Remove or disable** the setup endpoint/CLI tool
5. **Audit the database** to ensure no other unintended users exist
6. **Set up monitoring** for admin account creation

## Security Best Practices

1. **Use strong passwords** (minimum 12 characters, mixed case, numbers, symbols)
2. **Never commit** setup tokens or passwords to version control
3. **Use environment variables** for sensitive configuration
4. **Limit admin account creation** to specific IP addresses or times
5. **Enable audit logging** for all admin operations
6. **Regularly rotate** admin passwords
7. **Use separate admin accounts** for different purposes (e.g., operations, security, compliance)

## Running Seed in Production

If you need to run seed scripts in production (for system data only):

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Run seed - it will skip admin creation and test data
docker compose -f docker-compose.yml -f docker-compose.prod.yml up portal-seed
```

The seed script will:
- ✅ Seed permissions and roles
- ✅ Seed loyalty rules
- ✅ Seed system partner
- ❌ Skip admin user creation
- ❌ Skip test merchant/terminal data
- ❌ Skip finance service API calls
