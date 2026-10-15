/**
 * Creates an i18n mock with a configurable UI locale.
 *
 * @param locale Locale returned by getUILanguage.
 * @returns Mocked i18n module.
 */
export const createI18nMock = (locale: string) => ({
    __esModule: true,
    i18n: {
        getUILanguage: () => locale,
    },
});

export type I18nMockModule = {
    createI18nMock: typeof createI18nMock;
};
