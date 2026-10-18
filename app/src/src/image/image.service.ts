import { Injectable } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image, StatusEnum } from './entities/image.entity.js';
import { User } from '../user/entities/user.entity.js';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>
  ) {}

  async getCurrentStatus(user: User): Promise<StatusEnum | undefined> {
    return await this.imagesRepository
              .createQueryBuilder('images')
              .where('userUserId = :id', { id: user.user_id })
              .orderBy("timestamp", "DESC")
              .getOne()
              .then((img) => img?.status);
  }

  async create(user: User, url: string) {
    const currentStatus = await this.getCurrentStatus(user);
    const inputStatus = currentStatus === StatusEnum.IN ? StatusEnum.OUT : StatusEnum.IN;
    return await this.imagesRepository.save({ user: user, url: url, status: inputStatus});
  }

  async findImagesByUser(user_id: string) {
    return await this.imagesRepository
              .createQueryBuilder('images')
              .where('userUserId = :id', { id: user_id })
              // .andWhere('timestamp BETWEEN :start AND :end', { start: start, end: end })
              .orderBy("timestamp", "DESC")
              .getMany();
  }

  async deleteUserImages(user_id:string) {
    return await this.imagesRepository
              .createQueryBuilder('images')
              .delete()
              .where('userUserId = :id', { id: user_id })
              .execute();
  }
}
