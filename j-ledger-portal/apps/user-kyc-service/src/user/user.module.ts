import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController, UserAdminController } from './user.controller';

@Module({
  controllers: [UserController, UserAdminController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
