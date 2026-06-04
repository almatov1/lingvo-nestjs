import { Injectable, OnModuleInit } from "@nestjs/common"
import { Bot } from "grammy"
import { StateRouter } from "./state.router";

@Injectable()
export class BotService implements OnModuleInit {
    constructor(private readonly stateRouter: StateRouter) { }

    async onModuleInit() {
        const bot = new Bot(process.env.TELEGRAM_TOKEN!);

        bot.use(async (ctx, next) => {
            if (!ctx.from) return
            await next()
        });

        bot.on('message', (ctx) => this.stateRouter.handle(ctx));
        bot.on('callback_query', (ctx) => this.stateRouter.handleCallback(ctx));

        await bot.start();
    }
}
