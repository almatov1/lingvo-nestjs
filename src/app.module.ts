import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './core/prisma/prisma.module';
import { BotModule } from './modules/bot/bot.module';
import { I18nModule } from './core/i18n/i18n.module';
import { StorageModule } from './core/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StorageModule,
    I18nModule,
    BotModule
  ]
})
export class AppModule { }
