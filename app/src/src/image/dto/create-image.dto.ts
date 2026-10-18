import { PartialType } from "@nestjs/mapped-types";
import { Image } from "../entities/image.entity.js";

export class CreateImageDto extends PartialType(Image) {}
