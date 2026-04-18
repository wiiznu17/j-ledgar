import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const { email, password, pin } = body;
    // UserService.create expects pin as a string, but RegisterDto.pin is optional.
    // We provide a fallback or ensure it's handled. 
    // Usually registration requires a PIN in this flow.
    const user = await this.userService.create(email, password, pin || '');
    return {
      id: user.id,
      email: user.email,
    };
  }
}
