import { PartialType } from "@nestjs/mapped-types";
import { User } from "../entities/user.entity.js";

export class CreateUserDto {
    username: string
    password: string
}
