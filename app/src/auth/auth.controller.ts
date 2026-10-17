import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { User } from '../user/entities/user.entity.js';
import { Public } from './auth.constants.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    signIn(@Body() userDto: User) {
        return this.authService.signIn(userDto.username, userDto.password);
    }

    @HttpCode(HttpStatus.OK)
    @Get('role')
    checkRole(@Request() req: any) {
        return this.authService.getUserRole(req.user.user_id);
    }
}
