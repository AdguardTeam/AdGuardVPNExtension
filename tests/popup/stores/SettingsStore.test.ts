import {
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    vi,
    type MockInstance,
} from 'vitest';
import { configure, reaction, runInAction } from 'mobx';

import { SettingsStore } from '../../../src/popup/stores/SettingsStore';
import { type RootStore } from '../../../src/popup/stores/RootStore';
import { animationService } from '../../../src/popup/components/Settings/BackgroundAnimation/animationStateMachine';
import { AnimationEvent } from '../../../src/popup/constants';
import { ConnectivityStateType } from '../../../src/common/connectivityState';

// The popup configures MobX strict mode in src/popup/stores/index.ts.
configure({ enforceActions: 'observed' });

const {
    mockGetExclusionsInverted,
    mockIsVpnEnabledByUrl,
    mockEnableVpnByUrl,
    mockDisableVpnByUrl,
    mockTabsGetCurrent,
} = vi.hoisted(() => ({
    mockGetExclusionsInverted: vi.fn(),
    mockIsVpnEnabledByUrl: vi.fn(),
    mockEnableVpnByUrl: vi.fn(),
    mockDisableVpnByUrl: vi.fn(),
    mockTabsGetCurrent: vi.fn(),
}));

vi.mock('../../../src/common/messenger', () => ({
    messenger: {
        getExclusionsInverted: mockGetExclusionsInverted,
        isVpnEnabledByUrl: mockIsVpnEnabledByUrl,
        enableVpnByUrl: mockEnableVpnByUrl,
        disableVpnByUrl: mockDisableVpnByUrl,
    },
}));

vi.mock('../../../src/common/tabs', () => ({
    tabs: {
        getCurrent: mockTabsGetCurrent,
    },
}));

/**
 * Creates a store with a root store stub that tracks the active profile,
 * which the refresh checks before applying its result.
 *
 * @returns Settings store instance and the mutable active profile id.
 */
const makeStore = (): { store: SettingsStore; active: { id: string } } => {
    const active = { id: 'default' };
    const rootStore = {
        vpnStore: {
            get activeProfileId(): string {
                return active.id;
            },
        },
    } as unknown as RootStore;

    return { store: new SettingsStore(rootStore), active };
};

describe('SettingsStore exclusion state refresh', () => {
    let store: SettingsStore;
    let active: { id: string };
    let sendSpy: MockInstance<typeof animationService.send>;

    beforeEach(() => {
        ({ store, active } = makeStore());
        store.currentTabHostname = 'example.org';
        store.finishInit();
        sendSpy = vi.spyOn(animationService, 'send');
        sendSpy.mockClear();
        mockGetExclusionsInverted.mockReset();
        mockIsVpnEnabledByUrl.mockReset();
        mockTabsGetCurrent.mockReset();
    });

    afterEach(() => {
        sendSpy.mockRestore();
    });

    it('should re-read the mode flag and mark the tab as excluded when VPN is off for it', async () => {
        mockGetExclusionsInverted.mockResolvedValue(true);
        mockIsVpnEnabledByUrl.mockResolvedValue(false);

        await store.refreshExclusionsState('default');

        expect(mockGetExclusionsInverted).toHaveBeenCalledWith('default');
        expect(mockIsVpnEnabledByUrl).toHaveBeenCalledWith('example.org');
        expect(store.isCurrentTabExcluded).toBe(true);
    });

    it('should mark the tab as not excluded when VPN is on for it', async () => {
        mockGetExclusionsInverted.mockResolvedValue(false);
        mockIsVpnEnabledByUrl.mockResolvedValue(true);

        await store.refreshExclusionsState('default');

        expect(store.isCurrentTabExcluded).toBe(false);
    });

    it('should refresh the mode flag consumed by the site info', async () => {
        store.setIsRoutable(false);
        store.setIsExcluded(true);
        expect(store.displayNonRoutable).toBe(false);

        mockGetExclusionsInverted.mockResolvedValue(true);
        mockIsVpnEnabledByUrl.mockResolvedValue(false);

        await store.refreshExclusionsState('default');

        expect(store.displayNonRoutable).toBe(true);
    });

    it('should apply the refreshed state while the mode flag is observed', async () => {
        // The exclusions screen observes the mode flag through the site info;
        // MobX strict mode then requires the post-await writes to be actions.
        const dispose = reaction(() => store.displayNonRoutable, () => undefined);
        try {
            mockGetExclusionsInverted.mockResolvedValue(true);
            mockIsVpnEnabledByUrl.mockResolvedValue(false);

            await store.refreshExclusionsState('default');

            expect(store.isCurrentTabExcluded).toBe(true);
        } finally {
            dispose();
        }
    });

    it('should not apply the state of a profile that is no longer active', async () => {
        store.setIsExcluded(false);
        mockGetExclusionsInverted.mockImplementation(async () => {
            // a newer switch starts while the first refresh is in flight
            active.id = 'work';
            return true;
        });
        mockIsVpnEnabledByUrl.mockResolvedValue(false);

        await store.refreshExclusionsState('default');

        expect(store.isCurrentTabExcluded).toBe(false);
    });

    it('should not apply the state superseded while the second query is in flight', async () => {
        store.setIsExcluded(false);
        mockGetExclusionsInverted.mockResolvedValue(true);
        mockIsVpnEnabledByUrl.mockImplementation(async () => {
            // a newer switch starts while the second query is in flight
            active.id = 'work';
            return false;
        });

        await store.refreshExclusionsState('default');

        expect(store.isCurrentTabExcluded).toBe(false);
    });

    it('should drop a refresh superseded by a newer one for the same profile', async () => {
        store.setIsExcluded(false);
        let resolveMode: (value: boolean) => void = () => undefined;
        mockGetExclusionsInverted.mockImplementationOnce(
            () => new Promise((resolve) => {
                resolveMode = resolve;
            }),
        );
        mockGetExclusionsInverted.mockResolvedValue(true);
        mockIsVpnEnabledByUrl
            // the newer refresh reads the state while the first one is in flight
            .mockResolvedValueOnce(true)
            // the stale refresh would mark the site as excluded
            .mockResolvedValueOnce(false);

        const staleRefresh = store.refreshExclusionsState('default');

        // the user switches away and back, so a newer refresh for the same
        // profile starts and supersedes the first one
        await store.refreshExclusionsState('default');
        expect(store.isCurrentTabExcluded).toBe(false);

        resolveMode(false);
        await staleRefresh;

        expect(store.isCurrentTabExcluded).toBe(false);
    });

    it('should resolve the tab url when the hostname is not resolved yet', async () => {
        // @ts-expect-error the hostname is not resolved while the popup is loading
        store.currentTabHostname = undefined;
        mockTabsGetCurrent.mockResolvedValue({ url: 'http://example.org/page' });
        mockGetExclusionsInverted.mockResolvedValue(false);
        mockIsVpnEnabledByUrl.mockResolvedValue(true);

        await store.refreshExclusionsState('default');

        expect(mockIsVpnEnabledByUrl).toHaveBeenCalledWith('http://example.org/page');
        expect(store.isCurrentTabExcluded).toBe(false);
    });

    it('should pass a null url to the background when the tab has none', async () => {
        // @ts-expect-error the hostname is not resolved while the popup is loading
        store.currentTabHostname = undefined;
        mockTabsGetCurrent.mockResolvedValue({ url: '' });
        mockGetExclusionsInverted.mockResolvedValue(false);
        mockIsVpnEnabledByUrl.mockResolvedValue(true);

        await store.refreshExclusionsState('default');

        expect(mockIsVpnEnabledByUrl).toHaveBeenCalledWith(null);
    });

    it('should resolve without throwing when the mode query fails', async () => {
        store.setIsExcluded(true);
        mockGetExclusionsInverted.mockRejectedValue(new Error('no connection'));

        await expect(store.refreshExclusionsState('default')).resolves.toBeUndefined();
        expect(store.isCurrentTabExcluded).toBe(true);
    });

    it('should resolve without throwing when the url query fails', async () => {
        store.setIsExcluded(true);
        mockGetExclusionsInverted.mockResolvedValue(false);
        mockIsVpnEnabledByUrl.mockRejectedValue(new Error('no connection'));

        await expect(store.refreshExclusionsState('default')).resolves.toBeUndefined();
        expect(store.isCurrentTabExcluded).toBe(true);
    });

    it('should play the site animation when the refresh changes the routing state', async () => {
        store.setConnectivityState({ value: ConnectivityStateType.Connected });
        mockGetExclusionsInverted.mockResolvedValue(true);
        mockIsVpnEnabledByUrl.mockResolvedValue(false);
        sendSpy.mockClear();

        await store.refreshExclusionsState('default');

        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.SiteExcluded);
    });

    it('should re-read the state when a switch committed while the snapshot was in flight', async () => {
        store.setIsExcluded(false);
        // the snapshot was computed for 'default' while the switch committed
        active.id = 'work';
        mockGetExclusionsInverted.mockResolvedValue(true);
        mockIsVpnEnabledByUrl.mockResolvedValue(false);

        await store.reconcileExclusionsWithActiveProfile('default');

        expect(mockGetExclusionsInverted).toHaveBeenCalledWith('work');
        expect(store.isCurrentTabExcluded).toBe(true);
    });

    it('should keep the snapshot state when no switch committed', async () => {
        store.setIsExcluded(false);

        await store.reconcileExclusionsWithActiveProfile('default');

        expect(mockGetExclusionsInverted).not.toHaveBeenCalled();
        expect(store.isCurrentTabExcluded).toBe(false);
    });
});

describe('SettingsStore background animation', () => {
    let store: SettingsStore;
    let sendSpy: MockInstance<typeof animationService.send>;

    beforeEach(() => {
        ({ store } = makeStore());
        sendSpy = vi.spyOn(animationService, 'send');
        store.finishInit();
        sendSpy.mockClear();
    });

    afterEach(() => {
        sendSpy.mockRestore();
    });

    it('should play the disconnection animation when the site becomes excluded while connected', () => {
        store.setConnectivityState({ value: ConnectivityStateType.Connected });
        sendSpy.mockClear();

        store.setIsExcluded(true);

        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.SiteExcluded);
    });

    it('should play the connection animation when the site is routed again while connected', () => {
        store.setConnectivityState({ value: ConnectivityStateType.Connected });
        store.setIsExcluded(true);
        sendSpy.mockClear();

        store.setIsExcluded(false);

        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.VpnConnected);
    });

    it('should not animate when the routing state does not change', () => {
        store.setConnectivityState({ value: ConnectivityStateType.Connected });
        store.setIsExcluded(true);
        sendSpy.mockClear();

        store.setIsExcluded(true);

        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should stay disabled when the tunnel state changes while the site is excluded', () => {
        store.setIsExcluded(true);
        sendSpy.mockClear();

        store.setConnectivityState({ value: ConnectivityStateType.Connected });

        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.VpnDisconnected);
        expect(sendSpy).not.toHaveBeenCalledWith(AnimationEvent.VpnConnected);
    });

    it('should not animate the site state while the tunnel is down', () => {
        store.setConnectivityState({ value: ConnectivityStateType.DisconnectedIdle });
        store.setIsExcluded(true);
        sendSpy.mockClear();

        store.setIsExcluded(false);

        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should drive the animation from the exclude toggle on the settings screen', async () => {
        store.setConnectivityState({ value: ConnectivityStateType.Connected });
        store.currentTabHostname = 'example.org';
        mockEnableVpnByUrl.mockResolvedValue(undefined);
        mockDisableVpnByUrl.mockResolvedValue(undefined);
        sendSpy.mockClear();

        await store.disableVpnOnCurrentTab();
        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.SiteExcluded);

        sendSpy.mockClear();
        await store.enableVpnOnCurrentTab();
        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.VpnConnected);
    });

    it('should not animate during a new initialization and land on the resulting state', () => {
        store.startInit();
        store.setConnectivityState({ value: ConnectivityStateType.Connected });
        store.setIsExcluded(true);

        expect(sendSpy).not.toHaveBeenCalled();

        store.finishInit();

        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.InitDisabled);
    });

    it('should land on the enabled state when the initialization finishes while connected', () => {
        store.startInit();
        store.setConnectivityState({ value: ConnectivityStateType.Connected });

        store.finishInit();

        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.InitEnabled);
    });

    it('should follow the tunnel state on a tab that cannot be excluded', () => {
        store.setIsExcluded(true);
        runInAction(() => {
            store.canBeExcluded = false;
        });
        sendSpy.mockClear();

        store.setConnectivityState({ value: ConnectivityStateType.Connected });

        expect(sendSpy).toHaveBeenCalledWith(AnimationEvent.VpnConnected);
        expect(sendSpy).not.toHaveBeenCalledWith(AnimationEvent.VpnDisconnected);
    });

    it('should expose the site-excluded state shared with the layout', () => {
        store.setIsExcluded(true);
        expect(store.isSiteExcluded).toBe(true);

        runInAction(() => {
            store.canBeExcluded = false;
        });
        expect(store.isSiteExcluded).toBe(false);
    });
});
