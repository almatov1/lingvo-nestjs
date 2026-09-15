import { Injectable } from '@nestjs/common'
import { Context, InlineKeyboard, InputFile } from 'grammy'
import { LISTENING_1_AUDIO, LISTENING_1_TEST, LISTENING_2_AUDIO, LISTENING_2_TEST, LISTENING_3_AUDIO, LISTENING_3_TEST, READING_1_TEST, READING_1_TEXT, READING_2_TEST, READING_2_TEXT, READING_3_TEST, READING_3_TEXT, READING_4_TEST, READING_4_TEXT, VARIANT_LABEL } from 'src/common/constants/test';
import { I18nService } from 'src/core/i18n/i18n.service';
import { PrismaService } from 'src/core/prisma/prisma.service'
import { User } from 'src/generated/prisma/client';
import { Format, Level, Step, TaskType } from 'src/generated/prisma/enums';
import dedent from 'dedent';

@Injectable()
export class TestHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly i18n: I18nService
    ) { }

    private readonly MATERIALS = {
        0: { type: TaskType.LISTENING, file: LISTENING_1_AUDIO },
        5: { type: TaskType.LISTENING, file: LISTENING_2_AUDIO },
        10: { type: TaskType.LISTENING, file: LISTENING_3_AUDIO },

        20: { type: TaskType.READING, text: READING_1_TEXT },
        26: { type: TaskType.READING, text: READING_2_TEXT },
        36: { type: TaskType.READING, text: READING_3_TEXT },
        48: { type: TaskType.READING, text: READING_4_TEXT },
    };

    private readonly TEST = [
        ...LISTENING_1_TEST,
        ...LISTENING_2_TEST,
        ...LISTENING_3_TEST,
        ...READING_1_TEST,
        ...READING_2_TEST,
        ...READING_3_TEST,
        ...READING_4_TEST
    ];

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

        await ctx.answerCallbackQuery();

        if (nextQuestionIndex >= this.TEST.length) return this.finishTest(ctx, updatedUser);
        return this.sendQuestion(ctx, user, nextQuestionIndex);
    }

    async sendQuestion(ctx: Context, user: User, index: number) {
        const q = this.TEST[index];

        const keyboard = new InlineKeyboard();

        q.answers.forEach((_, i) => {
            keyboard.text(VARIANT_LABEL[i], String(i));

            if (i % 2 === 1) {
                keyboard.row();
            }
        });

        const answersText = q.answers
            .map((a, i) => `${VARIANT_LABEL[i]} ${a}`)
            .join('\n');

        const material = this.MATERIALS[index];

        const questionNumber = index < 20
            ? index + 1
            : index - 19;

        if (material) {
            if (index === 0) return await ctx.replyWithAudio(
                new InputFile(material.file),
                {
                    caption: dedent(`
                        ${this.i18n.t('test', user.language)}

                        ${questionNumber}. ${q.question}
                        ${answersText}
                    `),
                    parse_mode: 'HTML',
                    reply_markup: keyboard
                }
            );
            else {
                try { await ctx.deleteMessage() }
                catch { }
            }

            if (material.type === TaskType.LISTENING) {
                return await ctx.replyWithAudio(
                    new InputFile(material.file),
                    {
                        caption: dedent(`
                            ${questionNumber}. ${q.question}
                            ${answersText}
                        `),
                        parse_mode: 'HTML',
                        reply_markup: keyboard
                    }
                );
            }

            if (material.type === TaskType.READING) {
                return ctx.reply(
                    dedent(`
                        ${material.text}

                        ${questionNumber}. ${q.question}
                        ${answersText}
                    `),
                    {
                        parse_mode: 'HTML',
                        reply_markup: keyboard,
                    },
                );
            }
        }

        if (index < 20) {
            return ctx.editMessageCaption({
                caption: dedent(`
                    ${questionNumber}. ${q.question}
                    ${answersText}
                `),
                parse_mode: 'HTML',
                reply_markup: keyboard,
            });
        }

        const readingMaterial = Object.entries(this.MATERIALS)
            .reverse()
            .find(
                ([materialIndex, material]) =>
                    material.type === TaskType.READING &&
                    Number(materialIndex) <= index,
            );

        const readingText =
            readingMaterial?.[1].type === TaskType.READING
                ? readingMaterial[1].text
                : '';

        return ctx.editMessageText(
            dedent(`
                ${readingText}

                ${questionNumber}. ${q.question}
                ${answersText}
            `),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard,
            },
        );
    }

    private async finishTest(ctx: Context, user: User) {
        const listeningScore = user.testAnswers
            .slice(0, 20)
            .filter(
                (answer, index) =>
                    answer === this.TEST[index].correctAnswer
            )
            .length;

        const readingScore = user.testAnswers
            .slice(20, 60)
            .filter(
                (answer, index) =>
                    answer === this.TEST[index + 20].correctAnswer
            )
            .length;

        const level = this.getLevel(listeningScore, readingScore);

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

    private getLevel(listeningScore: number, readingScore: number): Level {
        if (listeningScore >= 16 && readingScore >= 32) return Level.C1;
        if (listeningScore >= 12 && readingScore >= 24) return Level.B2;
        if (listeningScore >= 10 && readingScore >= 20) return Level.B1;
        if (listeningScore >= 8 && readingScore >= 16) return Level.A2;
        if (listeningScore >= 6 && readingScore >= 12) return Level.A1;

        return Level.A1;
    }
}
