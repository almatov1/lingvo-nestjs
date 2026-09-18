import { Injectable } from '@nestjs/common'
import { Context, InlineKeyboard, InputFile } from 'grammy'
import { TOPICS } from 'src/common/constants/topics'
import { I18nService } from 'src/core/i18n/i18n.service'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StorageService } from 'src/core/storage/storage.service'
import { Level, OnlineScreen, TaskType, TopicResult, User } from 'src/generated/prisma/client'
import dedent from 'dedent';
import { VARIANT_LABEL_LOWER_CASE } from 'src/common/constants/test'
import { capitalizeFirstLetter } from 'src/core/utils/capitalize'

@Injectable()
export class LearningHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly i18n: I18nService
    ) { }

    private readonly LEVELS = [
        Level.A1,
        Level.A2,
        Level.B1,
        Level.B2,
        Level.C1
    ];

    // MENU

    async openMenu(ctx: Context, user: User) {
        await this.prisma.user.update({
            where: { id: user.id },
            data: { uiScreen: OnlineScreen.MENU }
        });

        const keyboard = new InlineKeyboard()
            .text(this.i18n.t('menu.levels', user.language), 'menu_levels')
            .row()
            .text(this.i18n.t('menu.toolbox', user.language), 'menu_toolbox');

        await ctx.editMessageText(
            this.i18n.t('menu.title', user.language),
            { reply_markup: keyboard }
        );
    }

    // LEVELS

    async showLevels(ctx: Context, user: User) {
        if (!user.level) return;

        const keyboard = new InlineKeyboard();

        await this.prisma.user.update({
            where: { id: user.id },
            data: { uiScreen: OnlineScreen.LEVELS }
        });

        const userLevelIndex = this.LEVELS.findIndex(l => l === user.level);

        this.LEVELS.forEach((level, index) => {
            const locked = index > userLevelIndex;
            let icon = '';

            if (locked) icon = '🔒'
            else if (index < userLevelIndex) icon = '✅'
            else if (index === userLevelIndex) icon = user.isLevelCompleted ? '✅' : '✍️';

            keyboard.text(
                `${icon} ${level}`,
                locked ? 'level_locked' : `level_${level}`
            );
            keyboard.row();
        });

        keyboard
            .text(this.i18n.t('menu.title', user.language), 'menu_back');

        await ctx.editMessageText(
            this.i18n.t('menu.levels', user.language),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // TOPICS

    async openLevel(ctx: Context, user: User, level: Level) {
        const topics = TOPICS[level];

        const results = await this.prisma.topicResult.findMany({
            where: {
                userId: user.id,
                level
            },
        }) as TopicResult[];

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                currentLevel: level,
                uiScreen: OnlineScreen.TOPICS
            }
        });

        const keyboard = new InlineKeyboard();

        let inProgressShown = false;
        topics.forEach((topic, index) => {
            const topicResult = results.find(r => r.topic === index);

            const isCompleted =
                topicResult
                && topicResult.writingAnswer
                && topicResult.readingAnswer.length === topic.readingTest.length
                && topicResult.listeningAnswer
                && topicResult.speakingFile;

            let icon = '';

            if (isCompleted) icon = '✅';
            else if (!inProgressShown) {
                icon = '✍️';
                inProgressShown = true;
            }

            keyboard.text(
                `${icon ? `${icon} ` : ''}${index + 1}-${this.i18n.t('topic', user.language)}`,
                `topic_${index}`
            );
            keyboard.row();
        });

        keyboard
            .text(this.i18n.t('menu.levels', user.language), 'menu_back');

        await ctx.editMessageText(
            this.i18n.t('menu.tasks', user.language),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // TOOLBOX

    async showToolbox(ctx: Context, user: User) {
        const keyboard = new InlineKeyboard();
        keyboard
            .text(this.i18n.t('menu.title', user.language), 'menu_back');

        await this.prisma.user.update({
            where: { id: user.id },
            data: { uiScreen: OnlineScreen.LEVELS }
        });

        await ctx.editMessageText(
            this.i18n.t('toolbox', user.language),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // TASKS

    async openTopic(ctx: Context, user: User, topicIndex: number) {
        const topic = TOPICS[user.currentLevel!][topicIndex];

        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: topicIndex,
            },
        }) as TopicResult | undefined;

        const keyboard = new InlineKeyboard();

        keyboard.text(
            this.i18n.t('menu.description', user.language),
            'task_description'
        );

        keyboard.row();

        keyboard.text(
            result?.writingAnswer
                ? `${this.i18n.t('menu.writing', user.language)} ✅`
                : this.i18n.t('menu.writing', user.language),
            'task_writing'
        );

        keyboard.text(
            result?.readingAnswer.length === topic.readingTest.length
                ? `${this.i18n.t('menu.reading', user.language)} ✅`
                : this.i18n.t('menu.reading', user.language),
            'task_reading'
        );

        keyboard.row();

        keyboard.text(
            result?.listeningAnswer
                ? `${this.i18n.t('menu.listening', user.language)} ✅`
                : this.i18n.t('menu.listening', user.language),
            'task_listening'
        );

        keyboard.text(
            result?.speakingFile
                ? `${this.i18n.t('menu.speaking', user.language)} ✅`
                : this.i18n.t('menu.speaking', user.language),
            'task_speaking'
        );

        keyboard.row();

        keyboard.text(this.i18n.t('menu.goBack', user.language), 'topic_back');

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                currentTopic: topicIndex,
                currentTask: undefined,
                uiScreen: OnlineScreen.TASK
            }
        });

        try { await ctx.deleteMessage() }
        catch { }

        await ctx.reply(
            `${topicIndex + 1}. ${capitalizeFirstLetter(TOPICS[user.currentLevel!][topicIndex].title[user.language])}`,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // DESCRIPTION

    async onDescription(ctx: Context, user: User) {
        const keyboard = new InlineKeyboard();
        keyboard.text(this.i18n.t('menu.goBack', user.language), 'menu_back');

        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        try { await ctx.deleteMessage() }
        catch { }

        await ctx.replyWithDocument(
            new InputFile(topic.description[user.language]),
            { reply_markup: keyboard }
        );
    }

    // WRITING

    async startWriting(ctx: Context, user: User) {
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: user.currentTopic!,
            },
        }) as TopicResult | undefined;

        if (result?.writingAnswer) await this.writingResult(ctx, user, false);
        else {
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
    }

    async writingResult(ctx: Context, user: User, isReply: boolean) {
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: user.currentTopic!,
            },
        }) as TopicResult | undefined;

        const text = dedent(`
            ${this.i18n.t('yourAnswer', user.language)}:
            ${result?.writingAnswer}

            ${this.i18n.t('correctlyAnswer', user.language)}:
            ${topic.writingAnswer}
        `);

        const keyboard = new InlineKeyboard();
        keyboard.text(this.i18n.t('menu.goBack', user.language), 'menu_back');

        if (isReply) await ctx.reply(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
        else await ctx.editMessageText(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // READING

    async startReading(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: user.currentTopic!
            },
        });
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];
        const questionIndex = result?.readingAnswer.length ?? 0;

        if (questionIndex >= topic.readingTest.length) {
            await this.readingResult(ctx, user, false);
            return;
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { currentTask: TaskType.READING }
        });

        const keyboard = new InlineKeyboard();
        const q = topic.readingTest[questionIndex];

        q.answers.forEach((_, i) => {
            keyboard.text(
                VARIANT_LABEL_LOWER_CASE[i],
                String(i)
            );

            if (i % 2 === 1) keyboard.row();
        });

        await ctx.editMessageText(
            dedent(`
                ${questionIndex === 0 && `${this.i18n.t('reading', user.language)}\n\n`}
                ${topic.reading}

                ${q.question}
                ${q.answers
                    .map((a, i) => `${VARIANT_LABEL_LOWER_CASE[i]} ${a}`)
                    .join('\n')}
            `),
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    async readingResult(ctx: Context, user: User, isReply: boolean) {
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: user.currentTopic!,
            },
        }) as TopicResult | undefined;

        const formattedAnswers = (result?.readingAnswer as string[])
            .map((ans, idx) => `${idx + 1}. ${ans}`)
            .join('\n');
        const text = dedent(`
            ${this.i18n.t('yourAnswer', user.language)}:
            ${formattedAnswers}

            ${this.i18n.t('correctlyAnswer', user.language)}:
            ${topic.readingAnswer}
        `);

        const keyboard = new InlineKeyboard();
        keyboard.text(this.i18n.t('menu.goBack', user.language), 'menu_back');

        if (isReply) await ctx.reply(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
        else await ctx.editMessageText(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // LISTENING

    async startListening(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: user.currentTopic!
            },
        });
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        if (result?.listeningAnswer) await this.listeningResult(ctx, user, false);
        else {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { currentTask: TaskType.LISTENING }
            });

            try { await ctx.deleteMessage() }
            catch { }

            await ctx.replyWithAudio(
                new InputFile(topic.listeningAudioPath),
                {
                    caption: dedent(`
                        ${this.i18n.t('listening', user.language)}

                        ${topic.listeningTitle[user.language]}

                        ${topic.listening}
                    `),
                    parse_mode: 'HTML'
                }
            );
        }
    }

    async listeningResult(ctx: Context, user: User, isReply: boolean) {
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: user.currentTopic!,
            },
        }) as TopicResult | undefined;

        const text = dedent(`
            ${this.i18n.t('yourAnswer', user.language)}:
            ${result?.listeningAnswer}

            ${this.i18n.t('correctlyAnswer', user.language)}:
            ${topic.listeningAnswer}
        `);

        const keyboard = new InlineKeyboard();
        keyboard.text(this.i18n.t('menu.goBack', user.language), 'menu_back');

        if (isReply) await ctx.reply(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
        else await ctx.editMessageText(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // SPEAKING

    async startSpeaking(ctx: Context, user: User) {
        const result = await this.prisma.topicResult.findFirst({
            where: {
                userId: user.id,
                level: user.currentLevel!,
                topic: user.currentTopic!
            },
        });
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        if (result?.speakingFile) await this.speakingResult(ctx, user, false);
        else {
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
    }

    async speakingResult(ctx: Context, user: User, isReply: boolean) {
        const topic = TOPICS[user.currentLevel!][user.currentTopic!];

        // const result = await this.prisma.topicResult.findFirst({
        //     where: {
        //         userId: user.id,
        //         level: user.currentLevel!,
        //         topic: user.currentTopic!,
        //     },
        // }) as TopicResult;

        const text = dedent(`
            ${this.i18n.t('correctlyAnswer', user.language)}:
            ${topic.speakingAnswer}
        `);

        const keyboard = new InlineKeyboard();
        keyboard.text(this.i18n.t('menu.goBack', user.language), 'menu_back');

        if (isReply) await ctx.reply(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
        else await ctx.editMessageText(
            text,
            {
                parse_mode: 'HTML',
                reply_markup: keyboard
            }
        );
    }

    // CALLBACK

    async handleCallback(ctx: Context, user: User) {
        const data = ctx.callbackQuery?.data;
        if (!data) return;
        if (!user.level) return;

        // MENU SCREEN
        if (user.uiScreen === OnlineScreen.MENU) {
            if (data === 'menu_levels')
                return this.showLevels(ctx, user);
            else if (data === 'menu_toolbox')
                return this.showToolbox(ctx, user);
            return;
        }

        // LEVELS SCREEN
        if (user.uiScreen === OnlineScreen.LEVELS) {
            if (data === 'menu_back')
                return this.openMenu(ctx, user);

            if (data === 'level_locked') {
                await ctx.answerCallbackQuery({
                    text: this.i18n.t('lockedLevel', user.language),
                    show_alert: true,
                });
                return;
            }

            if (data.startsWith('level_')) {
                const level = data.split('_')[1];
                return this.openLevel(ctx, user, Level[level]);
            }

            return;
        }

        // TOPICS SCREEN
        if (user.uiScreen === OnlineScreen.TOPICS) {
            if (data === 'menu_back')
                return this.showLevels(ctx, user);

            if (data.startsWith('topic_')) {
                const topicIndex = Number(data.split('_')[1]);
                if (Number.isNaN(topicIndex)) return;

                return this.openTopic(ctx, user, topicIndex);
            }

            return;
        }

        // TASK SCREEN
        if (user.uiScreen === OnlineScreen.TASK) {
            if (data === 'topic_back') return this.openLevel(ctx, user, user.currentLevel!);
            if (data === 'menu_back') return this.openTopic(ctx, user, user.currentTopic!);

            switch (data) {
                case 'task_description':
                    return this.onDescription(ctx, user);

                case 'task_writing':
                    return this.startWriting(ctx, user);

                case 'task_reading':
                    return this.startReading(ctx, user);

                case 'task_listening':
                    return this.startListening(ctx, user);

                case 'task_speaking':
                    return this.startSpeaking(ctx, user);
            }

            if (user.currentTask === TaskType.READING) {
                await ctx.answerCallbackQuery();

                const topicIndex = user.currentTopic!;
                const level = user.currentLevel!;

                const result = await this.prisma.topicResult.findFirst({
                    where: {
                        userId: user.id,
                        level,
                        topic: topicIndex,
                    },
                });
                const topic = TOPICS[level][topicIndex];

                const questionIndex = result?.readingAnswer.length ?? 0;
                const question = topic.readingTest[questionIndex];

                const answerIndex = Number(data);
                const answer = `${VARIANT_LABEL_LOWER_CASE[answerIndex]} ${question.answers[answerIndex]}`;

                const updatedAnswers = [
                    ...(result?.readingAnswer ?? []),
                    answer
                ];

                await this.prisma.topicResult.upsert({
                    where: {
                        userId_level_topic: {
                            userId: user.id,
                            level,
                            topic: topicIndex,
                        },
                    },
                    update: { readingAnswer: updatedAnswers },
                    create: {
                        userId: user.id,
                        level,
                        topic: topicIndex,
                        readingAnswer: updatedAnswers
                    }
                });

                const nextIndex = updatedAnswers.length;

                if (nextIndex < topic.readingTest.length) {
                    await this.startReading(ctx, user);
                    return;
                }

                await this.checkRaising(user);
                await this.readingResult(ctx, user, false);
                return;
            }
        }
    }

    async handle(ctx: Context, user: User) {
        if (user.currentTask === TaskType.WRITING) {
            const text = ctx.message?.text;

            await this.prisma.topicResult.upsert({
                where: {
                    userId_level_topic: {
                        userId: user.id,
                        level: user.currentLevel!,
                        topic: user.currentTopic!,
                    },
                },
                update: { writingAnswer: text },
                create: {
                    userId: user.id,
                    level: user.currentLevel!,
                    topic: user.currentTopic!,
                    writingAnswer: text
                },
            });

            await this.checkRaising(user);
            await this.writingResult(ctx, user, true);
        }

        else if (user.currentTask === TaskType.LISTENING) {
            const text = ctx.message?.text;

            await this.prisma.topicResult.upsert({
                where: {
                    userId_level_topic: {
                        userId: user.id,
                        level: user.currentLevel!,
                        topic: user.currentTopic!,
                    },
                },
                update: { listeningAnswer: text },
                create: {
                    userId: user.id,
                    level: user.currentLevel!,
                    topic: user.currentTopic!,
                    listeningAnswer: text,
                },
            });

            await this.checkRaising(user);
            await this.listeningResult(ctx, user, true);
        }

        else if (user.currentTask === TaskType.SPEAKING) {
            const voice = ctx.message?.voice;
            if (!voice) return;

            const file = await ctx.api.getFile(voice.file_id);
            const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;
            const response = await fetch(fileUrl);
            const buffer = Buffer.from(await response.arrayBuffer());
            const filename = this.storage.uploadFile('speaking', {
                originalname: `${voice.file_id}.ogg`,
                buffer,
            } as any);

            await this.prisma.topicResult.upsert({
                where: {
                    userId_level_topic: {
                        userId: user.id,
                        level: user.currentLevel!,
                        topic: user.currentTopic!,
                    },
                },
                update: { speakingFile: filename },
                create: {
                    userId: user.id,
                    level: user.currentLevel!,
                    topic: user.currentTopic!,
                    speakingFile: filename
                },
            });

            await this.checkRaising(user);
            await this.speakingResult(ctx, user, true);
        }
    }

    // CHECK RAISING

    async checkRaising(user: User) {
        if (!user.level || !user.currentLevel) return;

        const currentLevelIndex = this.LEVELS.findIndex(
            level => level === user.currentLevel
        );

        const topics = TOPICS[user.currentLevel];

        const results = await this.prisma.topicResult.findMany({
            where: {
                userId: user.id,
                level: user.currentLevel,
            },
        });

        const completed = topics.every((topic, index) => {
            const result = results.find(r => r.topic === index);

            if (!result) return false;

            return (
                !!result.writingAnswer &&
                result.readingAnswer.length === topic.readingTest.length &&
                !!result.listeningAnswer &&
                !!result.speakingFile
            );
        });

        if (!completed) return;

        if (currentLevelIndex >= this.LEVELS.length - 1) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isLevelCompleted: true },
            });

            return;
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                level: this.LEVELS[currentLevelIndex + 1],
            },
        });
    }
}
