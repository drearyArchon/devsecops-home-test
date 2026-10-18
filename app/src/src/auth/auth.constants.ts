import { SetMetadata } from "@nestjs/common";

// TODO: Change JWT Secret
export const jwtConstants = {
    secret: 'JWT SECRET. CHANGE TO SOMETHING COMPLEX FOR PRD'
}

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_USER_ACCESS_KEY = "isUserAccess";
export const UserAccess = () => SetMetadata(IS_USER_ACCESS_KEY, true);

export const IS_INIT_ACCESS_KEY = "isInitAccess";
export const InitializeAccess = () => SetMetadata(IS_INIT_ACCESS_KEY, true);