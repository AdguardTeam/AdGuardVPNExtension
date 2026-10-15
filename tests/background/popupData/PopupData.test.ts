import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { type EndpointsInterface } from '../../../src/background/endpoints/Endpoints';
import { type PermissionsCheckerInterface } from '../../../src/background/permissionsChecker/PermissionsChecker';
import { type PermissionsErrorInterface } from '../../../src/background/permissionsChecker/permissionsError';
import { type CredentialsInterface } from '../../../src/background/credentials/Credentials';
import { type NonRoutableServiceInterface } from '../../../src/background/routability/NonRoutableService';
import { PopupData } from '../../../src/background/popupData/PopupData';

const mockGetSelectedLocation = vi.hoisted(() => vi.fn());

vi.mock('../../../src/background/auth', () => ({
    auth: { isAuthenticated: vi.fn().mockResolvedValue(true) },
}));

vi.mock('../../../src/common/permissions', () => ({
    Permissions: { hasNeededHostPermissions: vi.fn().mockResolvedValue(true) },
}));

vi.mock('../../../src/background/settings', () => ({
    settings: {
        getSetting: vi.fn().mockReturnValue(undefined),
        getSelectedLanguage: vi.fn().mockReturnValue('en'),
        isProxyEnabled: vi.fn().mockReturnValue(true),
    },
}));

vi.mock('../../../src/background/endpoints/locationsService', () => ({
    locationsService: { getLocationsTab: vi.fn().mockResolvedValue('all') },
}));

vi.mock('../../../src/background/forwarder', () => ({
    forwarder: { updateAndGetDomain: vi.fn().mockResolvedValue(null) },
}));

vi.mock('../../../src/background/savedLocations', () => ({
    savedLocations: { getSavedLocationIds: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../../src/background/profiles', () => ({
    profilesService: {
        getActiveProfileId: vi.fn().mockReturnValue('default'),
        getProfileInfoList: vi.fn().mockResolvedValue({ profiles: [] }),
    },
}));

vi.mock('../../../src/background/profiles/profileManager', () => ({
    ProfileManager: { getApplyingProfileId: vi.fn().mockReturnValue(null) },
}));

vi.mock('../../../src/background/appStatus', () => ({
    appStatus: { canControlProxy: vi.fn().mockResolvedValue(true) },
}));

vi.mock('../../../src/background/connectivity/connectivityService', () => ({
    connectivityService: { state: { value: 'idle' } },
}));

vi.mock('../../../src/background/promoNotifications', () => ({
    promoNotifications: { getCurrentNotification: vi.fn().mockResolvedValue(null) },
}));

vi.mock('../../../src/background/updateService', () => ({
    updateService: { isFirstRun: false },
}));

vi.mock('../../../src/background/flagsStorage', () => ({
    flagsStorage: { getFlagsStorageData: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../../src/background/exclusions', () => ({
    exclusions: { isVpnEnabledByUrl: vi.fn().mockResolvedValue(true) },
}));

vi.mock('../../../src/background/rateModal', () => ({
    rateModal: { shouldShowRateModal: vi.fn().mockReturnValue(false) },
}));

vi.mock('../../../src/background/hintPopup', () => ({
    hintPopup: { shouldShowHintPopup: vi.fn().mockResolvedValue(false) },
}));

vi.mock('../../../src/background/mobileEdgePromoService', () => ({
    mobileEdgePromoService: { shouldShowBanner: vi.fn().mockResolvedValue(false) },
}));

vi.mock('../../../src/background/vpnBlockedNotice', () => ({
    vpnBlockedNotice: { shouldShowRegionNotice: vi.fn().mockResolvedValue(false) },
}));

vi.mock('../../../src/background/telemetry', () => ({
    telemetry: { ensureExperimentAssignment: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../src/background/abTestManager', () => ({
    abTestManager: { getVariantsForProps: vi.fn().mockResolvedValue({}) },
}));

describe('popup data', () => {
    const createPopupData = (): PopupData => new PopupData({
        permissionsChecker: {
            checkPermissions: vi.fn(),
        } as unknown as PermissionsCheckerInterface,
        permissionsError: {
            getError: vi.fn().mockReturnValue(null),
        } as unknown as PermissionsErrorInterface,
        nonRoutable: {
            isUrlRoutable: vi.fn().mockReturnValue(true),
        } as unknown as NonRoutableServiceInterface,
        endpoints: {
            getVpnInfo: vi.fn().mockResolvedValue(null),
            getLocations: vi.fn().mockResolvedValue([]),
            getSelectedLocation: mockGetSelectedLocation.mockResolvedValue(null),
        } as unknown as EndpointsInterface,
        credentials: {
            isPremiumToken: vi.fn().mockResolvedValue(true),
            getUsername: vi.fn().mockResolvedValue(null),
            getMarketingConsent: vi.fn().mockResolvedValue(false),
        } as unknown as CredentialsInterface,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetSelectedLocation.mockResolvedValue(null);
    });

    it('should request the selected location without persisting it (AG-60345)', async () => {
        const popupData = createPopupData();

        await popupData.getPopupData('https://example.org');

        expect(mockGetSelectedLocation).toHaveBeenCalledTimes(1);
        expect(mockGetSelectedLocation).toHaveBeenCalledWith({ persist: false });
    });
});
