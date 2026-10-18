import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User, UserRole } from './entities/user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { ImageService } from '../image/image.service.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private imageService: ImageService
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return await this.usersRepository.save(createUserDto);
  }

  async createAdmin(createUserDto: CreateUserDto): Promise<User> {
    return await this.usersRepository.save({
      ...createUserDto,
      role: UserRole.ADMIN
    });
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findByUserId(user_id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ user_id });
  }

  async findByUserName(username: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ username });
  }

  async update(user_id: string, updateUserDto: UpdateUserDto): Promise<UpdateResult> {
    return await this.usersRepository.update({ user_id }, updateUserDto);
  }

  async remove(user_id: string): Promise<DeleteResult> {
    return await this.imageService.deleteUserImages(user_id).then(() => {
      return this.usersRepository.delete(user_id);
    });
  }

  async checkAdminCredentials(username: string): Promise<boolean> {
    return await this.usersRepository.findOneBy({ username }).then((user) => user?.role === UserRole.ADMIN);
  }
  
  async getUserCount(): Promise<number> {
    return await this.usersRepository.count();
  }

  async getInitStatus(): Promise<boolean> {
    const userCount = await this.getUserCount();
    const initializeMode = process.env.ATTENDANCE_BOARD_SKIP_INIT ? false : true; // get initMode from env. default true
    return initializeMode && (userCount === 0);
  }
}
