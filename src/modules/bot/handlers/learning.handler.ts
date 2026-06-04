import { Injectable } from '@nestjs/common'
import { Context, InlineKeyboard, InputFile } from 'grammy'
import { TOPICS } from 'src/common/constants/topics'
import { I18nService } from 'src/core/i18n/i18n.service'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StorageService } from 'src/core/storage/storage.service'
import { Step, TaskType, TopicResult, User } from 'src/generated/prisma/client'
import dedent from 'dedent';
import { VARIANT_LABEL } from 'src/common/constants/test'

@Injectable()
export class LearningHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly i18n: I18nService
    ) { }

    async showTopics(ctx: Context, user: User) {
        if (!user.level) return;
        const topics = TOPICS[user.level];

        const results = await this.prisma.topicResult.findMany({
            where: {
                userId: user.id,
                level: user.level,
            },
        });
        const completed = new Set(
            results
                .filter(r => r.speakingFile)
                .map(r => r.topic)
        );

        const keyboard = new InlineKeyboard();

        topics.forEach((topic, index) => {
            const unlocked =
                index === 0 ||
                completed.has(index - 1);

            const alreadyCompleted = completed.has(index);

            keyboard.text(
                alreadyCompleted
                    ? `✅ ${index + 1}. ${topic.title}`
                    : unlocked
                        ? `${index + 1}. ${topic.title}`
                        : `🔒 ${index + 1}. ${topic.title}`,
                unlocked && !alreadyCompleted
                    ? `topic_${index}`
                    : 'topic_locked'
            );

            keyboard.row();
        });

        await ctx.reply(
            this.i18n.t('onlineFormat', user.language),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    async handleCallback(ctx: Context, user: User) {
        const data = ctx.callbackQuery?.data;
        if (!data) return;
        if (!user.level) return;

        await ctx.editMessageReplyMarkup();

        // TOPIC

        if (data.startsWith('topic_')) {
            if (data === 'topic_locked') {
                await ctx.answerCallbackQuery({
                    text: this.i18n.t('lockedTopic', user.language),
                    show_alert: true,
                });
                await this.showTopics(ctx, user);
                return;
            }

            const topicIndex = Number(data.split('_')[1]);
            if (Number.isNaN(topicIndex)) return;
            const topic = TOPICS[user.level]?.[topicIndex];

            await this.prisma.topicResult.upsert({
                where: {
                    userId_level_topic: {
                        userId: user.id,
                        level: user.level,
                        topic: topicIndex,
                    },
                },
                create: {
                    userId: user.id,
                    level: user.level,
                    topic: topicIndex,
                    readingAnswers: [],
                    listeningAnswers: [],
                },
                update: {},
            });

            const updatedUser = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    currentTopic: topicIndex,
                    currentTask: TaskType.READING,
                },
            });

            await ctx.reply(
                dedent(`   
                    <b>${topic.title}</b>

                    ${this.i18n.t('topic', user.language)}
                `),
                { parse_mode: 'HTML' }
            );
            await ctx.reply(
                this.i18n.t('reading', user.language),
                { parse_mode: 'HTML' }
            );
            await ctx.reply(
                topic.reading,
                { parse_mode: 'HTML' }
            );
            await this.sendReadingQuestion(ctx, updatedUser);
            return;
        }

        // TASKS

        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!,
            },
        }) as TopicResult;

        const topic = TOPICS[user.level!][result.topic];

        if (user.currentTask === TaskType.READING) {
            const answerIndex = Number(data);
            const updatedAnswers = [...result.readingAnswers, answerIndex];
            await this.prisma.topicResult.update({
                where: { id: result.id },
                data: {
                    readingAnswers: updatedAnswers,
                },
            });

            const nextIndex = updatedAnswers.length;
            if (nextIndex < topic.readingTest.length) {
                await this.sendReadingQuestion(ctx, user);
                return;
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    currentTask: TaskType.WRITING,
                },
            });
            await ctx.reply(
                this.i18n.t('writing', user.language),
                { parse_mode: 'HTML' }
            );
            await ctx.reply(topic.writing, { parse_mode: 'HTML' });
        }

        else if (user.currentTask === TaskType.LISTENING) {
            const answerIndex = Number(data);
            const updatedAnswers = [...result.listeningAnswers, answerIndex];
            await this.prisma.topicResult.update({
                where: { id: result.id },
                data: {
                    listeningAnswers: updatedAnswers,
                },
            });

            const nextIndex = updatedAnswers.length;
            if (nextIndex < topic.listeningTest.length) {
                await this.sendListeningQuestion(ctx, user);
                return;
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    currentTask: TaskType.SPEAKING,
                },
            });
            await ctx.reply(
                this.i18n.t('speaking', user.language),
                { parse_mode: 'HTML' }
            );
            await ctx.reply(topic.speaking, { parse_mode: 'HTML' });
        }
    }

    async sendReadingQuestion(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!
            },
        });

        const topic = TOPICS[user.level!][result?.topic!];

        const keyboard = new InlineKeyboard();

        const q = topic.readingTest[result?.readingAnswers.length!];
        topic.readingTest[result?.readingAnswers.length!].answers.forEach((a, i) => {
            keyboard.text(`${VARIANT_LABEL[i]} ${a}`, String(i));
            keyboard.row();
        });

        await ctx.reply(q.question, {
            reply_markup: keyboard,
        });
    }

    async handle(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!,
            },
        }) as TopicResult;
        const topic = TOPICS[user.level!][result.topic];

        if (user.currentTask === TaskType.WRITING) {
            const text = ctx.message?.text;

            await this.prisma.topicResult.update({
                where: { id: result.id },
                data: {
                    writingAnswer: text,
                },
            });

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    currentTask: TaskType.LISTENING,
                },
            });

            await ctx.reply(
                this.i18n.t('listening', user.language),
                { parse_mode: 'HTML' }
            );
            await ctx.replyWithAudio(new InputFile(topic.listening));
            await this.sendListeningQuestion(ctx, user);
        }

        else if (user.currentTask === TaskType.SPEAKING) {
            const voice = ctx.message?.voice;
            if (!voice) return;

            const result = await this.prisma.topicResult.findFirst({
                where: {
                    userId: user.id,
                    level: user.level!,
                    topic: user.currentTopic!,
                },
            }) as TopicResult;

            const file = await ctx.api.getFile(voice.file_id);
            const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;
            const response = await fetch(fileUrl);
            const buffer = Buffer.from(await response.arrayBuffer());
            const filename = this.storage.uploadFile('speaking', {
                originalname: `${voice.file_id}.ogg`,
                buffer,
            } as any);

            await this.prisma.topicResult.update({
                where: { id: result.id },
                data: {
                    speakingFile: filename
                },
            });

            const currentIndex = user.currentTopic!;
            const nextTopic = TOPICS[user.level!]?.[currentIndex + 1];

            if (nextTopic) {
                const updatedUser = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        currentTask: null,
                        currentTopic: null
                    },
                });

                await ctx.reply(this.i18n.t('finishTopic', user.language), { parse_mode: 'HTML' });
                await this.showTopics(ctx, updatedUser);
                return;
            }

            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    currentStep: Step.COMPLETED,
                    currentTask: null,
                    currentTopic: null
                },
            });
            await ctx.reply(
                this.i18n.t('completed', user.language),
                { parse_mode: 'HTML' }
            );
        }
    }

    async sendListeningQuestion(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!
            },
        });

        const topic = TOPICS[user.level!][result?.topic!];

        const keyboard = new InlineKeyboard();

        const q = topic.listeningTest[result?.listeningAnswers.length!];
        topic.listeningTest[result?.listeningAnswers.length!].answers.forEach((a, i) => {
            keyboard.text(`${VARIANT_LABEL[i]} ${a}`, String(i));
            keyboard.row();
        });

        await ctx.reply(q.question, {
            reply_markup: keyboard,
        });
    }
}
