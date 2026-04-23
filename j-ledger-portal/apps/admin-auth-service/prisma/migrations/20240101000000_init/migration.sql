-- Init migration for admin-auth-service

CREATE SCHEMA IF NOT EXISTS admin_auth_schema;

-- Staff table
CREATE TABLE "admin_auth_schema"."Staff" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- Role table
CREATE TABLE "admin_auth_schema"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- Permission table
CREATE TABLE "admin_auth_schema"."Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- StaffRole junction table
CREATE TABLE "admin_auth_schema"."StaffRole" (
    "staffId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffRole_pkey" PRIMARY KEY ("staffId", "roleId")
);

-- RolePermission junction table
CREATE TABLE "admin_auth_schema"."RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

-- Indexes
CREATE UNIQUE INDEX "Staff_username_key" ON "admin_auth_schema"."Staff"("username");
CREATE UNIQUE INDEX "Staff_email_key" ON "admin_auth_schema"."Staff"("email");
CREATE UNIQUE INDEX "Role_name_key" ON "admin_auth_schema"."Role"("name");
CREATE UNIQUE INDEX "Permission_name_key" ON "admin_auth_schema"."Permission"("name");

-- Foreign keys
ALTER TABLE "admin_auth_schema"."StaffRole" ADD CONSTRAINT "StaffRole_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "admin_auth_schema"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_auth_schema"."StaffRole" ADD CONSTRAINT "StaffRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_auth_schema"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_auth_schema"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin_auth_schema"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_auth_schema"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "admin_auth_schema"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
