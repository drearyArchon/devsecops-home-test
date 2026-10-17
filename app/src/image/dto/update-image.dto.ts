import { PartialType } from '@nestjs/mapped-types';
import { CreateImageDto } from './create-image.dto.js';

export class UpdateImageDto extends PartialType(CreateImageDto) {}
