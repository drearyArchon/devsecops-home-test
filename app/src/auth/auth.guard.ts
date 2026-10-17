import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_USER_ACCESS_KEY, IS_PUBLIC_KEY, IS_INIT_ACCESS_KEY } from "./auth.constants.js";
import { Request } from "express";
import { UserService } from "../user/user.service.js";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private reflector: Reflector,
        private userService: UserService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        const isInitAccess = this.reflector.getAllAndOverride<boolean>(IS_INIT_ACCESS_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        const isUserAccess = this.reflector.getAllAndOverride<boolean>(IS_USER_ACCESS_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if (isPublic) {
            // Public Endpoints can be used by anyone
            return true;
        }

        if (isInitAccess) {
            // Init Endpoints only available when there are no users and init mode is allowed
            const initStatus = await this.userService.getInitStatus();
            if (initStatus) {
                return true;
            }
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if(!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(token);
            request['user'] = payload;
        } catch {
            throw new UnauthorizedException();
        }

        if (isUserAccess) {
            return true;
        }
        return await this.userService.checkAdminCredentials(request['user'].username);
    }
    
    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}