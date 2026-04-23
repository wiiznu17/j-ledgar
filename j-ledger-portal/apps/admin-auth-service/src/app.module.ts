import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { RoleModule } from './role/role.module';
import { PermissionModule } from './permission/permission.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    StaffModule,
    RoleModule,
    PermissionModule,
    AuditModule,
  ],
})
export class AppModule {}
