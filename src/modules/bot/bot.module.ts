import { Module } from '@nestjs/common'
import { BotService } from './bot.service'
import { StateRouter } from './state.router'
import { LanguageHandler } from './handlers/language.handler'
import { RegistrationHandler } from './handlers/registration.handler'
import { TestHandler } from './handlers/test.handler'
import { FormatHandler } from './handlers/format.handler'
import { LearningHandler } from './handlers/learning.handler'
import { StorageModule } from 'src/core/storage/storage.module'

@Module({
    imports: [StorageModule],
    providers: [
        BotService,
        StateRouter,
        LanguageHandler,
        RegistrationHandler,
        TestHandler,
        FormatHandler,
        LearningHandler
    ],
})
export class BotModule { }