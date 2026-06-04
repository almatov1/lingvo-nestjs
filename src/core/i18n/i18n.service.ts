import { Injectable } from '@nestjs/common';
import { translations, Locale } from '../i18n';

@Injectable()
export class I18nService {
    t(
        key: string,
        locale: Locale,
        params?: Record<string, string | number>,
    ): string {
        const parts = key.split('.');

        let value: any = translations[locale];

        for (const part of parts) {
            value = value?.[part];
        }

        if (!value) {
            return key;
        }

        if (typeof value !== 'string') {
            return key;
        }

        return value.replace(
            /\{\{(\w+)\}\}/g,
            (_, variable) => String(params?.[variable] ?? ''),
        );
    }
}
