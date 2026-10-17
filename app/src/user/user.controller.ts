import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InitializeAccess, Public } from '../auth/auth.constants.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Get(':user_id')
  findOne(@Param('user_id') user_id: string) {
    return this.userService.findByUserId(user_id);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':user_id')
  update(@Param('user_id') user_id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(user_id, updateUserDto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':user_id')
  remove(@Param('user_id') user_id: string) {
    return this.userService.remove(user_id);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('/init')
  checkInitStatus() {
    return this.userService.getInitStatus();
  }

  @InitializeAccess()
  @HttpCode(HttpStatus.CREATED)
  @Post('/init')
  createAdmin(@Body() createUserDto: CreateUserDto) {
    console.log("Creating Admin")
    
    return this.userService.create(createUserDto);
  }
}
