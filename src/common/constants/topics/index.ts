import { Level } from "src/generated/prisma/enums";
import { A1_TOPICS } from "./a1";
import { A2_TOPICS } from "./a2";
import { B1_TOPICS } from "./b1";
import { B2_TOPICS } from "./b2";

export interface Topic {
    title: {
        kk: string;
        ru: string;
        en: string;
    };
    description: {
        kk: string;
        ru: string;
        en: string;
    };
    writingTitle: {
        kk: string;
        ru: string;
        en: string;
    };
    writing: string;
    reading: string;
    readingTest: {
        question: string;
        answers: string[];
    }[];
    listeningAudioPath: string;
    listeningTitle: {
        kk: string;
        ru: string;
        en: string;
    };
    listening: string;
    speakingTitle: {
        kk: string;
        ru: string;
        en: string;
    };
    speaking: string;
}

export const TOPICS: Record<Level, Topic[]> = {
    [Level.A1]: A1_TOPICS,
    [Level.A2]: A2_TOPICS,
    [Level.B1]: B1_TOPICS,
    [Level.B2]: B2_TOPICS,
    [Level.C1]: []
};
