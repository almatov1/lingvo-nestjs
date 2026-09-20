import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/prisma/prisma.service";
import { Context } from "grammy";
import { StateRouter } from "../state.router";

@Injectable()
export class RestartHandler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly stateRouter: StateRouter
    ) { }

    async handle(ctx: Context) {
        if (!ctx.from) return;

        await this.prisma.user.delete({
            where: {
                telegramId: BigInt(ctx.from.id),
            },
        });

        await this.stateRouter.handle(ctx);
    }
}
