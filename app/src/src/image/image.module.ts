import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ImageService } from './image.service.js';
import { ImageController } from './image.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './entities/image.entity.js';
import { extname, join } from 'path';

const uploadDir = join(process.cwd(), 'resources');

@Module({
  imports: [
    TypeOrmModule.forFeature([Image]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const ext = extname(file.originalname);
          const filename = `${Date.now()}${ext}`;
          cb(null, filename);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
          cb(null, true);
        } else {
          cb(new Error('Only .jpeg or .png are allowed...'), false);
        }
      },
    }),
  ],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService]
})
export class ImageModule {}
