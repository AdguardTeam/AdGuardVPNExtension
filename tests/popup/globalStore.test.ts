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
        getStartupData: vi.fn(),
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

    const mockConsentData = (overrides: Record<string, unknown> = {}) => ({
        policyAgreement: false,
        helpUsImprove: false,
        webAuthFlowState: WebAuthState.Idle,
        forwarderDomain: MOCK_FORWARDER_DOMAIN,
        selectedLanguage: 'en' as const,
        experimentVariants: {},
        ...overrides,
    });

    it('should set forwarderDomain from consent data', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue(mockConsentData());

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.settingsStore.forwarderDomain).toBe(MOCK_FORWARDER_DOMAIN);
    });

    it('should apply auth cache (policyAgreement, helpUsImprove, webAuthFlowState)', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue(mockConsentData({
            policyAgreement: true,
            helpUsImprove: true,
            webAuthFlowState: WebAuthState.Loading,
        }));

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.authStore.policyAgreement).toBe(true);
        expect(rootStore.authStore.helpUsImprove).toBe(true);
        expect(rootStore.authStore.webAuthFlowState).toBe(WebAuthState.Loading);
    });

    it('should enable TelemetryStore and experiment variants from consent before onboarding', async () => {
        const setTelemetryEnabled = vi.spyOn(rootStore.telemetryStore, 'setIsHelpUsImproveEnabled');
        const setExperimentVariants = vi.spyOn(rootStore.uiStore, 'setExperimentVariants');
        const experimentVariants = { experiment_2: 'AG-55378-personalized-onboarding-paywall-b' };

        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue(mockConsentData({
            policyAgreement: true,
            helpUsImprove: true,
            experimentVariants,
        }));

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(setTelemetryEnabled).toHaveBeenCalledWith(true);
        expect(setExperimentVariants).toHaveBeenCalledWith(experimentVariants);
        expect(rootStore.uiStore.isPersonalizedOnboardingVariant).toBe(true);
    });

    it('should restore web auth flow state on popup reopen', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue(mockConsentData({
            policyAgreement: true,
            webAuthFlowState: WebAuthState.Opened,
        }));

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.authStore.webAuthFlowState).toBe(WebAuthState.Opened);
    });

    it('should return authentication status', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(true);
        vi.mocked(messenger.getConsentData).mockResolvedValue(mockConsentData({
            policyAgreement: true,
        }));

        const result = await rootStore.globalStore.initAuthenticatedStatus();

        expect(result).toBe(true);
    });

    it('should mark authenticated status as retrieved', async () => {
        vi.mocked(messenger.isAuthenticated).mockResolvedValue(false);
        vi.mocked(messenger.getConsentData).mockResolvedValue(mockConsentData());

        expect(rootStore.authStore.authenticatedStatusRetrieved).toBe(false);

        await rootStore.globalStore.initAuthenticatedStatus();

        expect(rootStore.authStore.authenticatedStatusRetrieved).toBe(true);
    });
});
