import { Column, CreateDateColumn, Entity, ForeignKey, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../../user/entities/user.entity.js";

export enum StatusEnum {
    IN = "in",
    OUT = "out"
}

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    image_id: string;

    @CreateDateColumn({ utc: false })
    timestamp: Date;

    @Column()
    url: string;

    @Column({
        type: "enum",
        enum: StatusEnum,
        default: StatusEnum.IN
    })
    status: StatusEnum;
    

    @ManyToOne((type) => User)
    user: User;
}
