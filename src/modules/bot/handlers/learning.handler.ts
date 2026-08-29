import { Injectable } from '@nestjs/common'
import { Context, InlineKeyboard, InputFile } from 'grammy'
import { TOPICS } from 'src/common/constants/topics'
import { I18nService } from 'src/core/i18n/i18n.service'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StorageService } from 'src/core/storage/storage.service'
import { OnlineScreen, TaskType, TopicResult, User } from 'src/generated/prisma/client'
import dedent from 'dedent';
import { VARIANT_LABEL } from 'src/common/constants/test'

@Injectable()
export class LearningHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly i18n: I18nService
    ) { }

    async openMenu(ctx: Context, user: User) {
        await this.prisma.user.update({
            where: { id: user.id },
            data: { uiScreen: OnlineScreen.MENU }
        });

        const keyboard = new InlineKeyboard()
            .text(this.i18n.t('menu.topics', user.language), 'menu_topics')
            .row()
            .text(this.i18n.t('menu.toolbox', user.language), 'menu_toolbox');

        await ctx.editMessageText(
            this.i18n.t('menu.title', user.language),
            { reply_markup: keyboard }
        );
    }

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
                index === 0 || completed.has(index - 1);
            const done = completed.has(index);

            keyboard.text(
                done
                    ? `✅ ${index + 1}. ${topic.title[user.language]}`
                    : unlocked
                        ? `${index + 1}. ${topic.title[user.language]}`
                        : `🔒 ${index + 1}. ${topic.title[user.language]}`,
                unlocked && !done ? `topic_${index}` : 'topic_locked'
            );
            keyboard.row();
        });

        keyboard
            .text(this.i18n.t('menu.back', user.language), 'menu_back')

        await this.prisma.user.update({
            where: { id: user.id },
            data: { uiScreen: OnlineScreen.TOPICS }
        });

        await ctx.editMessageText(
            this.i18n.t('onlineFormat', user.language),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    async showToolbox(ctx: Context, user: User) {
        const keyboard = new InlineKeyboard();
        keyboard
            .text(this.i18n.t('menu.back', user.language), 'menu_back');

        await this.prisma.user.update({
            where: { id: user.id },
            data: { uiScreen: OnlineScreen.TOPICS }
        });

        await ctx.editMessageText(
            this.i18n.t('toolbox', user.language),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    async openTopic({ ctx, user, topicIndex, isTaskFinish, isReply }: { ctx: Context, user: User, topicIndex: number, isTaskFinish?: boolean, isReply?: boolean }) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: topicIndex,
            },
        });

        if (!result) await this.prisma.topicResult.upsert({
            where: {
                userId_level_topic: {
                    userId: user.id,
                    level: user.level!,
                    topic: topicIndex,
                },
            },
            create: {
                userId: user.id,
                level: user.level!,
                topic: topicIndex,
                readingAnswers: []
            },
            update: {},
        });

        const writingDone = !!result?.writingAnswer;
        const readingDone = !!result?.readingAnswers?.length;
        const listeningDone = !!result?.listeningAnswer;
        const speakingDone = !!result?.speakingFile;

        const writingIcon = "✍️";
        const readingIcon = "📖";
        const listeningIcon = "🎧";
        const speakingIcon = "🗣️";

        const keyboard = new InlineKeyboard();

        keyboard.text(
            `${writingDone ? '✅' : writingIcon} ${this.i18n.t('menu.writing', user.language)}`,
            writingDone ? 'task_locked' : 'lesson_writing'
        );

        keyboard.text(
            `${!writingDone ? '🔒' : readingDone ? '✅' : readingIcon} ${this.i18n.t('menu.reading', user.language)}`,
            !writingDone || readingDone ? 'task_locked' : 'lesson_reading'
        );

        keyboard.row();

        keyboard.text(
            `${!readingDone ? '🔒' : listeningDone ? '✅' : listeningIcon} ${this.i18n.t('menu.listening', user.language)}`,
            !readingDone || listeningDone ? 'task_locked' : 'lesson_listening'
        );

        keyboard.text(
            `${!listeningDone ? '🔒' : speakingDone ? '✅' : speakingIcon} ${this.i18n.t('menu.speaking', user.language)}`,
            !listeningDone || speakingDone ? 'task_locked' : 'lesson_speaking'
        );

        keyboard.row();

        keyboard.text(this.i18n.t('menu.back', user.language), 'menu_back')

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                currentTopic: topicIndex,
                uiScreen: OnlineScreen.LESSON
            }
        });

        if (isReply) await ctx.reply(
            dedent(`
                ${topicIndex + 1}. ${TOPICS[user.level!][topicIndex].title[user.language]}

                ${topicIndex + 1}. ${TOPICS[user.level!][topicIndex].description[user.language]}

                ${isTaskFinish
                    ? `${this.i18n.t('finishedTask', user.language)}
                    
                    `
                    : ''}
                ${this.i18n.t('topic', user.language)}
            `),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
        else await ctx.editMessageText(
            dedent(`
                ${topicIndex + 1}. ${TOPICS[user.level!][topicIndex].title[user.language]}

                ${topicIndex + 1}. ${TOPICS[user.level!][topicIndex].description[user.language]}

                ${isTaskFinish
                    ? `${this.i18n.t('finishedTask', user.language)}
                    
                    `
                    : ''}
                ${this.i18n.t('topic', user.language)}
            `),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    async startWriting(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!
            },
        });
        const topic = TOPICS[user.level!][result?.topic!];

        await this.prisma.user.update({
            where: { id: user.id },
            data: { currentTask: TaskType.WRITING }
        });

        await ctx.editMessageText(
            dedent(`
                ${this.i18n.t('writing', user.language)}

                ${topic.writingTitle[user.language]}

                ${topic.writing}
            `),
            { parse_mode: 'HTML' }
        );
    }

    async startReading(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!
            },
        });
        const topic = TOPICS[user.level!][result?.topic!];

        await this.prisma.user.update({
            where: { id: user.id },
            data: { currentTask: TaskType.READING }
        });

        const keyboard = new InlineKeyboard();

        const q = topic.readingTest[result?.readingAnswers.length!];
        topic.readingTest[result?.readingAnswers.length!].answers.forEach((a, i) => {
            keyboard.text(`${VARIANT_LABEL[i]} ${a}`, String(i));
            keyboard.row();
        });

        if (result?.readingAnswers.length! === 0) {
            await ctx.editMessageText(dedent(`
                ${this.i18n.t('reading', user.language)}

                ${topic.reading}
            `), { parse_mode: 'HTML' });
            await ctx.reply(q.question, { reply_markup: keyboard });
        }
        else await ctx.editMessageText(q.question, { reply_markup: keyboard });
    }

    async startListening(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!
            },
        });
        const topic = TOPICS[user.level!][result?.topic!];

        await this.prisma.user.update({
            where: { id: user.id },
            data: { currentTask: TaskType.LISTENING }
        });

        await ctx.editMessageText(
            dedent(`
                ${this.i18n.t('listening', user.language)}
            `),
            { parse_mode: 'HTML' }
        );
        await ctx.replyWithAudio(new InputFile(topic.listeningAudioPath));
        await ctx.reply(
            dedent(`
                ${topic.listeningTitle[user.language]}

                ${topic.listening}
            `),
            { parse_mode: 'HTML' },
        );
    }

    async startSpeaking(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!
            },
        });
        const topic = TOPICS[user.level!][result?.topic!];

        await this.prisma.user.update({
            where: { id: user.id },
            data: { currentTask: TaskType.SPEAKING }
        });

        await ctx.editMessageText(
            dedent(`
                ${this.i18n.t('speaking', user.language)}

                ${topic.speakingTitle[user.language]}

                ${topic.speaking}
            `),
            { parse_mode: 'HTML' }
        );
    }

    async handleCallback(ctx: Context, user: User) {
        const data = ctx.callbackQuery?.data;
        if (!data) return;
        if (!user.level) return;

        // MENU SCREEN
        if (user.uiScreen === OnlineScreen.MENU) {
            if (data === 'menu_topics')
                return this.showTopics(ctx, user);
            else if (data === 'menu_toolbox')
                return this.showToolbox(ctx, user);
            return;
        }

        // TOPICS SCREEN
        if (user.uiScreen === OnlineScreen.TOPICS) {
            if (data === 'menu_back')
                return this.openMenu(ctx, user);

            if (data === 'topic_locked') {
                await ctx.answerCallbackQuery({
                    text: this.i18n.t('lockedTopic', user.language),
                    show_alert: true,
                });
                return;
            }

            if (data.startsWith('topic_')) {
                const topicIndex = Number(data.split('_')[1]);
                if (Number.isNaN(topicIndex)) return;

                return this.openTopic({ ctx, user, topicIndex });
            }

            return;
        }

        // LESSONG SCREEN
        if (user.uiScreen === OnlineScreen.LESSON) {
            if (data === 'menu_back') return this.showTopics(ctx, user);

            switch (data) {
                case 'lesson_writing':
                    return this.startWriting(ctx, user);

                case 'lesson_reading':
                    return this.startReading(ctx, user);

                case 'lesson_listening':
                    return this.startListening(ctx, user);

                case 'lesson_speaking':
                    return this.startSpeaking(ctx, user);

                case 'task_locked':
                    await ctx.answerCallbackQuery({
                        text: this.i18n.t('lockedTask', user.language),
                        show_alert: true,
                    });
                    return;
            }

            if (user.currentTask === TaskType.READING) {
                if (!/^\d+$/.test(data)) return;

                await ctx.answerCallbackQuery();

                const topicIndex = user.currentTopic!;
                const level = user.level!;

                const result = await this.prisma.topicResult.findFirst({
                    where: {
                        userId: user.id,
                        level,
                        topic: topicIndex,
                    },
                });
                const topic = TOPICS[level][topicIndex];

                const answerIndex = Number(data);
                const updatedAnswers = [
                    ...(result!.readingAnswers ?? []),
                    answerIndex
                ];
                await this.prisma.topicResult.update({
                    where: { id: result!.id },
                    data: { readingAnswers: updatedAnswers },
                });

                const nextIndex = updatedAnswers.length;
                if (nextIndex < topic.readingTest.length) {
                    await this.startReading(ctx, user);
                    return;
                }

                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        currentTask: null,
                    },
                });
                await this.openTopic({ ctx, user, topicIndex, isTaskFinish: true });
                return;
            }
        }
    }

    async handle(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.level!,
                topic: user.currentTopic!,
            },
        }) as TopicResult;

        if (user.currentTask === TaskType.WRITING) {
            const text = ctx.message?.text;

            await this.prisma.topicResult.update({
                where: { id: result.id },
                data: {
                    writingAnswer: text,
                },
            });

            await this.openTopic({ ctx, user, topicIndex: user.currentTopic!, isTaskFinish: true, isReply: true });
        }

        else if (user.currentTask === TaskType.LISTENING) {
            const text = ctx.message?.text;

            await this.prisma.topicResult.update({
                where: { id: result.id },
                data: {
                    listeningAnswer: text,
                },
            });

            await this.openTopic({ ctx, user, topicIndex: user.currentTopic!, isTaskFinish: true, isReply: true });
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

            await this.openTopic({ ctx, user, topicIndex: user.currentTopic!, isTaskFinish: true, isReply: true });
        }
    }
}
