import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) { return this.users.getMe(req.user.id) }

  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateUserDto) { return this.users.updateMe(req.user.id, dto) }
}