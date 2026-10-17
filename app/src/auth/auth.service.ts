import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service.js';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../user/entities/user.entity.js';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {}

    async signIn(
        username: string, 
        pass: string
    ): Promise<{ access_token: string }> {
        const user = await this.userService.findByUserName(username);
        if (user?.password !== pass) {
            throw new UnauthorizedException();
        }
        
        const payload = {
            sub: user.user_id,
            user_id: user.user_id,
            username: user.username,
            role: user.role
        };

        // TODO use bcrypt to encrypt passwords
        return {
            access_token: await this.jwtService.signAsync(payload)
        };
    }

    async getUserRole(user_id: string): Promise<UserRole | undefined> {
        const user = await this.userService.findByUserId(user_id);
        return user?.role;
    }
}
