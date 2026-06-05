import { Injectable } from '@nestjs/common'
import { Context, InlineKeyboard } from 'grammy'
import { TEST, VARIANT_LABEL } from 'src/common/constants/test';
import { I18nService } from 'src/core/i18n/i18n.service';
import { PrismaService } from 'src/core/prisma/prisma.service'
import { User } from 'src/generated/prisma/client';
import { Format, Level, Step } from 'src/generated/prisma/enums';
import dedent from 'dedent';

@Injectable()
export class TestHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly i18n: I18nService
    ) { }

    async handleCallback(ctx: Context, user: User) {
        const answerIndex = Number(ctx.callbackQuery!.data!);
        const answers = user.testAnswers ?? [];
        const nextAnswers = [...answers, answerIndex];
        const nextQuestionIndex = nextAnswers.length;

        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                testAnswers: nextAnswers,
            },
        });

        if (nextQuestionIndex >= TEST.length) return this.finishTest(ctx, updatedUser);
        return this.sendQuestion(ctx, nextQuestionIndex);
    }

    async sendQuestion(ctx: Context, index: number, isAdditionalText?: string) {
        const q = TEST[index];

        const keyboard = new InlineKeyboard();

        q.answers.forEach((a, i) => {
            keyboard.text(`${VARIANT_LABEL[i]} ${a}`, String(i));
            if (i % 2 === 1) keyboard.row();
        });

        if (isAdditionalText) await ctx.reply(
            dedent(`
                ${isAdditionalText}

                ${q.question}
            `),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard,
            }
        );
        else {
            await ctx.answerCallbackQuery();
            await ctx.editMessageText(q.question, {
                parse_mode: 'HTML',
                reply_markup: keyboard,
            });
        }
    }

    private async finishTest(ctx: Context, user: User) {
        const score = user.testAnswers.filter(
            (answer, index) => answer === TEST[index].correctAnswer
        ).length;

        // const level =
        //     score < 6 ? Level.A1 :
        //         score < 11 ? Level.A2 :
        //             score < 16 ? Level.B1 :
        //                 score < 21 ? Level.B2
        //                     : Level.C1;

        const level =
            score < 2 ? Level.A1 :
                score < 3 ? Level.A2 :
                    score < 4 ? Level.B1 :
                        score < 5 ? Level.B2
                            : Level.C1;

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                level,
                currentStep: Step.LEARNING_FORMAT
            },
        });

        await ctx.answerCallbackQuery();

        await ctx.editMessageText(
            dedent(`
                ${this.i18n.t('testResult', user.language, {
                level,
                levelName: this.i18n.t(`levelNames.${level}`, user.language)
            })}

                ${this.i18n.t('chooseFormat', user.language)}
            `),
            {
                parse_mode: 'HTML',
                reply_markup: new InlineKeyboard()
                    .text(this.i18n.t(`formats.${Format.Online}`, user.language), `format_${Format.Online}`)
                    .text(this.i18n.t(`formats.${Format.Offline}`, user.language), `format_${Format.Offline}`)
            }
        );
    }
}
