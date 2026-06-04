import { Injectable } from '@nestjs/common'
import { Context, InlineKeyboard } from 'grammy'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { User } from 'src/generated/prisma/client'
import { Language, Step } from 'src/generated/prisma/enums'
import dedent from 'dedent';
import { I18nService } from 'src/core/i18n/i18n.service'

@Injectable()
export class LanguageHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly i18n: I18nService
    ) { }

    async handle(ctx: Context, _: User) {
        const text = dedent(`
            🇰🇿 <b>ҚОШ КЕЛДІҢІЗ!</b>
            Сәлеметсіз бе! 👋
            Ақтөбе облысының Тілдерді оқыту орталығы әзірлеген тіл үйрену алаңына қош келдіңіз!
            Өзіңізге ыңғайлы тілді таңдаңыз:

            🇷🇺 <b>ДОБРО ПОЖАЛОВАТЬ!</b>
            Здравствуйте! 👋
            Добро пожаловать на платформу по изучению языков, разработанную Центром обучения языкам Актюбинской области!
            Выберите удобный для вас язык:

            🇬🇧 <b>WELCOME!</b>
            Hello! 👋
            Welcome to the language learning platform developed by the Aktobe Region Language Learning Center!
            Choose your preferred language:
        `);

        await ctx.reply(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: new InlineKeyboard()
                    .text('🇰🇿 Қазақ тілі', 'lang_kk')
                    .text('🇷🇺 Русский язык', 'lang_ru')
                    .text('🇬🇧 English', 'lang_en'),
            }
        )
    }

    async handleCallback(ctx: Context, user: any) {
        const data = ctx.callbackQuery!.data!;

        const langMap: Record<string, Language> = {
            [`lang_${Language.kk}`]: Language.kk,
            [`lang_${Language.ru}`]: Language.ru,
            [`lang_${Language.en}`]: Language.en,
        };

        const lang = langMap[data];
        if (!lang) return;

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                language: lang,
                currentStep: Step.REGISTRATION
            },
        });

        await ctx.editMessageReplyMarkup();
        await ctx.answerCallbackQuery();
        await ctx.reply(
            this.i18n.t('registration', lang),
            { parse_mode: 'HTML' }
        );
    }
}
