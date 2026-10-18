import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    user_id: string;

    @Column("varchar", { 
        length: 255,
        unique: true
    })
    username: string;

    @Column("varchar", { 
        length: 255
    })
    password: string;

    @Column({ default: "http://localhost:3100/img/DefaultProfile.jpg" })
    profileImageUrl: string; 

    @Column({ 
        type: "enum",
        enum: UserRole,
        default: UserRole.USER 
    })
    role: UserRole;
}
