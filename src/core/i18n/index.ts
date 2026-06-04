import kk from './kk';
import ru from './ru';
import en from './en';

export const translations = {
    kk,
    ru,
    en,
} as const;

export type Locale = keyof typeof translations;
