import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { phoneNumber, password, pin } = body;
    const user = await this.userService.create(phoneNumber, password, pin);
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
    };
  }
}
