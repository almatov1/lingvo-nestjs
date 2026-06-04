import { Injectable } from '@nestjs/common'
import { Context } from 'grammy'
import { I18nService } from 'src/core/i18n/i18n.service';
import { PrismaService } from 'src/core/prisma/prisma.service'
import { Step, User } from 'src/generated/prisma/client'
import { TestHandler } from './test.handler';

@Injectable()
export class RegistrationHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly testHandler: TestHandler,
        private readonly i18n: I18nService
    ) { }

    async handle(ctx: Context, user: User) {
        const text = ctx.message?.text;
        if (!text) return;

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                data: text,
                currentStep: Step.PLACEMENT_TEST
            },
        });
        await ctx.reply(
            this.i18n.t('test', user.language),
            { parse_mode: 'HTML' }
        );
        await this.testHandler.sendQuestion(ctx, 0);
    }
}
