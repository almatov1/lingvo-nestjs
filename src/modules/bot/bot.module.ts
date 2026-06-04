import { Module } from '@nestjs/common'
import { BotService } from './bot.service'
import { StateRouter } from './state.router'
import { LanguageHandler } from './handlers/language.handler'
import { RegistrationHandler } from './handlers/registration.handler'
import { TestHandler } from './handlers/test.handler'
import { FormatHandler } from './handlers/format.handler'

@Module({
    providers: [
        BotService,
        StateRouter,
        LanguageHandler,
        RegistrationHandler,
        TestHandler,
        FormatHandler
    ],
})
export class BotModule { }