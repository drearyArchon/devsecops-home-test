import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ImageModule } from './image/image.module.js';
import { UserModule } from './user/user.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity.js';
import { Image } from './image/entities/image.entity.js';
import { ConfigModule } from '@nestjs/config';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY as string,
      appSecret: process.env.OBSERVE_APP_SECRET as string,
      serviceId: 'attendance-board',
    }),
    ConfigModule.forRoot(),
    UserModule,
    ImageModule,
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.DB_URL,
      entities: [User, Image],
      timezone: '+07:00',
      dateStrings: false,
      synchronize: true // TODO: Set false on PRD
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
