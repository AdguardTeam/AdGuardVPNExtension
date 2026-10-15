import {
    vi,
    describe,
    it,
    expect,
} from 'vitest';

import { vpnApi } from '../../../src/background/api/vpnApi';
import { type I18nMockModule } from '../../__mocks__/i18nMock';

vi.mock('webextension-polyfill', () => ({
    __esModule: true,
    default: {
        i18n: {
            getUILanguage: () => 'en-US',
        },
    },
}));

vi.mock('../../../src/background/api/fallbackApi', () => ({
    __esModule: true,
    fallbackApi: {
        getVpnApiUrl: async () => 'https://test.example.com',
    },
}));

vi.mock('../../../src/common/i18n', async () => {
    const { createI18nMock } = await vi.importActual<I18nMockModule>('../../__mocks__/i18nMock');
    return createI18nMock('de');
});

describe('vpnApi', () => {
    it('getExclusionsServices requests services in the current app language', async () => {
        const makeRequestSpy = vi.spyOn(vpnApi, 'makeRequest').mockResolvedValue({});

        await vpnApi.getExclusionsServices();

        expect(makeRequestSpy).toHaveBeenCalledWith(
            'v2/exclusion_services',
            { params: { locale: 'de' } },
            'GET',
        );
    });

    it('getVpnCredentials sends app language and separate system language', async () => {
        const makeRequestSpy = vi.spyOn(vpnApi, 'makeRequest').mockResolvedValue({});

        await vpnApi.getVpnCredentials('appId', 'token', '1.0.0', true);

        const [, config] = makeRequestSpy.mock.calls[0];
        const { params } = config as { params: Record<string, string> };
        expect(params.language).toBe('de');
        expect(params.system_language).toBe('en-US');
    });

    it('trackExtensionInstallation sends app language and separate system language', async () => {
        const makeRequestSpy = vi.spyOn(vpnApi, 'makeRequest').mockResolvedValue({});

        await vpnApi.trackExtensionInstallation('appId', '1.0.0');

        const [, config] = makeRequestSpy.mock.calls[0];
        const { params } = config as { params: Record<string, string> };
        expect(params.language).toBe('de');
        expect(params.system_language).toBe('en-US');
    });
});
