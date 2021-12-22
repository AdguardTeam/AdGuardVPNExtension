import { ExclusionsService } from '../../../src/background/exclusions/ExclusionsService';
import { ExclusionsModes } from '../../../src/common/exclusionsConstants';

jest.mock('../../../src/background/browserApi');

jest.mock('../../../src/lib/logger.js');

jest.mock('../../../src/background/settings', () => {
    return {
        __esModule: true,
        settings: {
            getExclusions: () => {
                return [];
            },
            setExclusions: () => {},
        },
    };
});

jest.mock('../../../src/background/providers/vpnProvider', () => {
    return {
        __esModule: true,
        vpnProvider: {
            getExclusionsServices: async () => Promise.resolve({
                services: {},
                categories: {},
            }),
            getExclusionsServicesDomains: async () => Promise.resolve({}),
        },
    };
});

describe('ExclusionsService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('empty after init', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        const exclusionsData = exclusionsService.getExclusions();
        expect(exclusionsData).toHaveLength(0);
        expect(exclusionsService.getMode()).toBeTruthy();
    });

    it('returns true if domains are not excluded ', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        expect(exclusionsService.isVpnEnabledByUrl('http://example.org')).toBeTruthy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.com')).toBeTruthy();
        expect(exclusionsService.isVpnEnabledByUrl('example.org')).toBeTruthy();
    });

    it('returns false if domains are excluded', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('example.org');

        expect(exclusionsService.isVpnEnabledByUrl('http://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org/test')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://mail.example.org/test')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://example.com')).toBeTruthy();
    });

    it('should toggle exclusion group', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('https://example.org');

        // check init state
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).toBeFalsy();

        // toggle
        await exclusionsService.toggleExclusionState('example.org');

        // check toggled state
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeTruthy();
        expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).toBeTruthy();

        // toggle
        await exclusionsService.toggleExclusionState('example.org');

        // check toggled state
        expect(exclusionsService.isVpnEnabledByUrl('https://example.org')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('https://test.example.org')).toBeFalsy();
    });

    it('should add three exclusions if more than two level hostname added', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('test.example.org');

        const exclusions = exclusionsService.getExclusions();
        expect(exclusions[0].children).toHaveLength(3);
        expect(exclusions[0].children.map((ex) => ex.value)).toEqual([
            'example.org',
            '*.example.org',
            'test.example.org',
        ]);
    });

    it('should add two exclusions if hostname with wildcard added', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();

        await exclusionsService.addUrlToExclusions('*.example.org');
        const exclusions = exclusionsService.getExclusions();
        expect(exclusions[0].children).toHaveLength(2);
        expect(exclusions[0].children.map((ex) => ex.value)).toEqual([
            'example.org',
            '*.example.org',
        ]);
    });

    it('punycode test', async () => {
        const exclusionsService = new ExclusionsService();
        await exclusionsService.init();
        await exclusionsService.setMode(ExclusionsModes.Regular);
        expect(exclusionsService.getMode()).toBeTruthy();

        await exclusionsService.addUrlToExclusions('https://сайт.рф/');
        expect(exclusionsService.isVpnEnabledByUrl('https://xn--80aswg.xn--p1ai/')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('xn--80aswg.xn--p1ai')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('сайт.рф')).toBeFalsy();

        await exclusionsService.addUrlToExclusions('http://xn--e1afmkfd.xn--p1ai/');
        expect(exclusionsService.isVpnEnabledByUrl('пример.рф')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('http://xn--e1afmkfd.xn--p1ai/')).toBeFalsy();
        expect(exclusionsService.isVpnEnabledByUrl('xn--e1afmkfd.xn--p1ai')).toBeFalsy();
    });
});
