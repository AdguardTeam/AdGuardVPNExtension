import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { vpnBlockedNotice } from '../../src/background/vpnBlockedNotice/vpnBlockedNoticeService';

const { mockStorage, mockUserLocationService } = vi.hoisted(() => ({
    mockStorage: {
        get: vi.fn(),
        set: vi.fn(),
    },
    mockUserLocationService: {
        isUserInAffectedRegion: vi.fn(),
    },
}));

vi.mock('../../src/background/browserApi', () => ({
    browserApi: {
        storage: mockStorage,
    },
}));

vi.mock('../../src/background/userLocationService', () => ({
    userLocationService: mockUserLocationService,
}));

describe('VpnBlockedNotice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('shouldShowRegionNotice', () => {
        it('should return false when user is not in affected region', async () => {
            mockUserLocationService.isUserInAffectedRegion.mockReturnValue(false);

            const result = await vpnBlockedNotice.shouldShowRegionNotice();

            expect(result).toBe(false);
            expect(mockStorage.get).not.toHaveBeenCalled();
        });

        it('should return false when user is in affected region but notice was already shown', async () => {
            mockUserLocationService.isUserInAffectedRegion.mockReturnValue(true);
            mockStorage.get.mockResolvedValueOnce(true);

            const result = await vpnBlockedNotice.shouldShowRegionNotice();

            expect(result).toBe(false);
        });

        it('should return true when user is in affected region and notice was not shown', async () => {
            mockUserLocationService.isUserInAffectedRegion.mockReturnValue(true);
            mockStorage.get.mockResolvedValueOnce(false);

            const result = await vpnBlockedNotice.shouldShowRegionNotice();

            expect(result).toBe(true);
        });
    });

    describe('hasBeenShown', () => {
        it.each([undefined, null, false])('should return false when storage returns %s', async (value) => {
            mockStorage.get.mockResolvedValueOnce(value);

            const result = await vpnBlockedNotice.hasBeenShown();

            expect(result).toBe(false);
            expect(mockStorage.get).toHaveBeenCalledWith('vpn.blocked.notice.has.shown');
        });

        it('should return true when notice has been shown', async () => {
            mockStorage.get.mockResolvedValueOnce(true);

            const result = await vpnBlockedNotice.hasBeenShown();

            expect(result).toBe(true);
            expect(mockStorage.get).toHaveBeenCalledWith('vpn.blocked.notice.has.shown');
        });
    });

    describe('markAsShown', () => {
        it('should set storage value to true', async () => {
            mockStorage.set.mockResolvedValueOnce(undefined);

            await vpnBlockedNotice.markAsShown();

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith('vpn.blocked.notice.has.shown', true);
        });
    });
});
