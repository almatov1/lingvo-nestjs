import { Injectable } from '@nestjs/common'
import { Context } from 'grammy'
import { I18nService } from 'src/core/i18n/i18n.service';
import { PrismaService } from 'src/core/prisma/prisma.service'
import { User } from 'src/generated/prisma/client';
import { Format, Step } from 'src/generated/prisma/enums';
import { LearningHandler } from './learning.handler';

@Injectable()
export class FormatHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly i18n: I18nService,
        private readonly learningHandler: LearningHandler
    ) { }

    async handleCallback(ctx: Context, user: User) {
        const data = ctx.callbackQuery!.data!;
        const formatMap: Record<string, Format> = {
            [`format_${Format.Online}`]: Format.Online,
            [`format_${Format.Offline}`]: Format.Offline
        };

        const format = formatMap[data];
        if (!format) return;

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                format,
                currentStep: format === Format.Online
                    ? Step.FORMAT_ONLINE
                    : Step.FORMAT_OFFLINE
            },
        });

        await ctx.editMessageReplyMarkup();
        await ctx.answerCallbackQuery();

        if (format === Format.Offline) await ctx.reply(
            this.i18n.t('offlineFormat', user.language),
            { parse_mode: 'HTML' }
        );
        else await this.learningHandler.showTopics(ctx, user);
    }
}
