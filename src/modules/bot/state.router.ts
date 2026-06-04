import { Injectable } from "@nestjs/common"
import { PrismaService } from "src/core/prisma/prisma.service"
import { Context } from 'grammy'
import { Step } from "src/generated/prisma/enums";
import { LanguageHandler } from "./handlers/language.handler";
import { RegistrationHandler } from "./handlers/registration.handler";
import { TestHandler } from "./handlers/test.handler";
import { FormatHandler } from "./handlers/format.handler";

@Injectable()
export class StateRouter {
    constructor(
        private readonly prisma: PrismaService,
        private readonly languageHandler: LanguageHandler,
        private readonly registrationHandler: RegistrationHandler,
        private readonly testHandler: TestHandler,
        private readonly formatHandler: FormatHandler
    ) { }

    async handle(ctx: Context) {
        let user = await this.prisma.user.findUnique({
            where: { telegramId: BigInt(ctx.from!.id) }
        })

        if (!user) {
            user = await this.prisma.user.create({
                data: { telegramId: BigInt(ctx.from!.id) }
            })
        }

        switch (user.currentStep) {
            case Step.CHOOSE_LANGUAGE:
                return this.languageHandler.handle(ctx, user);
            case Step.REGISTRATION:
                return this.registrationHandler.handle(ctx, user);
        }
    }

    async handleCallback(ctx: Context) {
        let user = await this.prisma.user.findUnique({
            where: { telegramId: BigInt(ctx.from!.id) }
        });

        if (!user) return

        switch (user.currentStep) {
            case Step.CHOOSE_LANGUAGE:
                return this.languageHandler.handleCallback(ctx, user);
            case Step.PLACEMENT_TEST:
                return this.testHandler.handleCallback(ctx, user);
            case Step.LEARNING_FORMAT:
                return this.formatHandler.handleCallback(ctx, user);
        }
    }
}
