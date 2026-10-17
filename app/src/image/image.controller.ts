import { Controller, Get, Post, Request, HttpCode, HttpStatus, Query, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ImageService } from './image.service.js';
import { UserAccess } from '../auth/auth.constants.js';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @UserAccess()
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Request() req: any, @UploadedFile() file: any): Promise<{ url: string}> {
    const fileUrl = `http://localhost:3100/img/${file.filename}`
    await this.imageService.create(req.user, fileUrl);
    return {
        url: fileUrl,
      }
  }

  @UserAccess()
  @HttpCode(HttpStatus.OK)
  @Get()
  findUserImages(@Request() req: any) {
    return this.imageService.findImagesByUser(req.user.user_id);
  }

  @HttpCode(HttpStatus.OK)
  @Get(':user_id')
  findImagesByUser(@Param('user_id') user_id: string) {
    return this.imageService.findImagesByUser(user_id);
  }

  // @HttpCode(HttpStatus.OK)
  // @Get('/all')
  // findAll() {
  //   return this.imageService.findAll();
  // }

  // @UserAccess()
  // @HttpCode(HttpStatus.OK)
  // @Get(':image_id')
  // findOne(@Param('image_id') image_id: string) {
  //   return this.imageService.findOne(image_id);
  // }

  // @UserAccess()
  // @HttpCode(HttpStatus.OK)
  // @Put(':image_id')
  // update(@Param('image_id') image_id: string, @Body() updateImageDto: UpdateImageDto) {
  //   return this.imageService.update(image_id, updateImageDto);
  // }

  // @UserAccess()
  // @HttpCode(HttpStatus.OK)
  // @Delete(':image_id')
  // remove(@Param('image_id') image_id: string) {
  //   return this.imageService.remove(image_id);
  // }
}
