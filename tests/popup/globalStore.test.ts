import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';

import { WebAuthState } from '../../src/background/auth/webAuthEnums';
import { messenger } from '../../src/common/messenger';
import { RootStore } from '../../src/popup/stores/RootStore';

vi.mock('../../src/common/messenger', () => ({
    messenger: {
        isAuthenticated: vi.fn(),
        getConsentData: vi.fn(),
    },
}));

vi.mock('../../src/common/i18n', () => ({
    i18n: {
        init: vi.fn(),
        connectStore: vi.fn(() => ({})),
    },
}));

// SettingsStore uses window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('GlobalStore.initAuthenticatedStatus', () => {
    let rootStore: RootStore;

    const MOCK_FORWARDER_DOMAIN = 'link.adtidy.net';

    beforeEach(() => {
        vi.clearAllMocks();
        rootStore = new RootStore();
    });

    it('should set forwarderDomain from consent data', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue({
            policyAgreement: false,
            helpUsImprove: false,
            webAuthFlowState: WebAuthState.Idle,
            forwarderDomain: MOCK_FORWARDER_DOMAIN,
            selectedLanguage: 'en',
        });

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.settingsStore.forwarderDomain).toBe(MOCK_FORWARDER_DOMAIN);
    });

    it('should apply auth cache (policyAgreement, helpUsImprove, webAuthFlowState)', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue({
            policyAgreement: true,
            helpUsImprove: true,
            webAuthFlowState: WebAuthState.Loading,
            forwarderDomain: MOCK_FORWARDER_DOMAIN,
            selectedLanguage: 'en',
        });

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.authStore.policyAgreement).toBe(true);
        expect(rootStore.authStore.helpUsImprove).toBe(true);
        expect(rootStore.authStore.webAuthFlowState).toBe(WebAuthState.Loading);
    });

    it('should restore web auth flow state on popup reopen', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue({
            policyAgreement: true,
            helpUsImprove: false,
            webAuthFlowState: WebAuthState.Opened,
            forwarderDomain: MOCK_FORWARDER_DOMAIN,
            selectedLanguage: 'en',
        });

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.authStore.webAuthFlowState).toBe(WebAuthState.Opened);
    });

    it('should return authentication status', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(true);
        vi.mocked(messenger.getConsentData).mockResolvedValue({
            policyAgreement: true,
            helpUsImprove: false,
            webAuthFlowState: WebAuthState.Idle,
            forwarderDomain: MOCK_FORWARDER_DOMAIN,
            selectedLanguage: 'en',
        });

        const result = await rootStore.globalStore.initAuthenticatedStatus();

        expect(result).toBe(true);
    });

    it('should mark authenticated status as retrieved', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue({
            policyAgreement: false,
            helpUsImprove: false,
            webAuthFlowState: WebAuthState.Idle,
            forwarderDomain: MOCK_FORWARDER_DOMAIN,
            selectedLanguage: 'en',
        });

        expect(rootStore.authStore.authenticatedStatusRetrieved).toBe(false);

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.authStore.authenticatedStatusRetrieved).toBe(true);
    });
});
