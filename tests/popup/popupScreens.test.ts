import { describe, it, expect } from 'vitest';

import { derivePopupScreen, type PopupScreenDeps } from '../../src/popup/components/App/popupScreens';
import { PopupScreen } from '../../src/popup/components/App/popupAppMachineEnums';

/**
 * Input leaf values used to build the {@link PopupScreenDeps} mock.
 */
interface DepsInput {
    canControlProxy: boolean;
    hasGlobalError: boolean;
    hasLimitExceededError: boolean;
    showLimitExceededScreen: boolean;
    isHostPermissionsGranted: boolean;
    authenticated: boolean;
    renderUpgradeScreen: boolean;
    isOpenLocationsScreen: boolean;
    isOpenStatsScreen: boolean;
    isPremiumToken: boolean;
    filteredLocationsLength: number;
    notSearchingAndSavedTab: boolean;
    isProfilesScreenOpen: boolean;
}

const DEFAULT_INPUT: Required<DepsInput> = {
    canControlProxy: true,
    hasGlobalError: false,
    hasLimitExceededError: false,
    showLimitExceededScreen: false,
    isHostPermissionsGranted: true,
    authenticated: true,
    renderUpgradeScreen: false,
    isOpenLocationsScreen: false,
    isOpenStatsScreen: false,
    isPremiumToken: true,
    filteredLocationsLength: 1,
    notSearchingAndSavedTab: true,
    isProfilesScreenOpen: false,
};

/**
 * Builds a {@link PopupScreenDeps} mock from leaf values.
 *
 * The deps type mirrors the real store classes (via `RootStore[...]`), so the
 * partial mock is cast — only the properties read by {@link derivePopupScreen}
 * are populated.
 *
 * @param input Leaf-value overrides.
 * @returns A deps mock for derivePopupScreen.
 */
const makeDeps = (input: Partial<DepsInput> = {}): PopupScreenDeps => {
    const i = { ...DEFAULT_INPUT, ...input };
    return {
        settingsStore: {
            canControlProxy: i.canControlProxy,
            hasGlobalError: i.hasGlobalError,
            hasLimitExceededError: i.hasLimitExceededError,
            showLimitExceededScreen: i.showLimitExceededScreen,
            isHostPermissionsGranted: i.isHostPermissionsGranted,
        },
        authStore: {
            authenticated: i.authenticated,
            renderUpgradeScreen: i.renderUpgradeScreen,
        },
        uiStore: { isOpenLocationsScreen: i.isOpenLocationsScreen },
        statsStore: { isOpenStatsScreen: i.isOpenStatsScreen },
        vpnStore: {
            isPremiumToken: i.isPremiumToken,
            filteredLocations: Array(i.filteredLocationsLength).fill({}),
            notSearchingAndSavedTab: i.notSearchingAndSavedTab,
            isProfilesScreenOpen: i.isProfilesScreenOpen,
        },
    } as unknown as PopupScreenDeps;
};

describe('derivePopupScreen', () => {
    describe('default', () => {
        it('returns Main when no error/limit/navigation flags are set', () => {
            expect(derivePopupScreen(makeDeps())).toBe(PopupScreen.Main);
        });
    });

    describe('priority order', () => {
        it('host permissions error has the highest priority', () => {
            const screen = derivePopupScreen(makeDeps({
                isHostPermissionsGranted: false,
                hasGlobalError: true,
                showLimitExceededScreen: true,
                isOpenLocationsScreen: true,
            }));

            expect(screen).toBe(PopupScreen.HostPermissionsError);
        });

        it('no-locations error beats limit-exceeded and locations (when no global error)', () => {
            const screen = derivePopupScreen(makeDeps({
                showLimitExceededScreen: true,
                isOpenLocationsScreen: true,
                filteredLocationsLength: 0,
            }));

            expect(screen).toBe(PopupScreen.NoLocationsError);
        });

        it('global error beats no-locations error', () => {
            const screen = derivePopupScreen(makeDeps({
                hasGlobalError: true,
                showLimitExceededScreen: true,
                isOpenLocationsScreen: true,
                filteredLocationsLength: 0,
            }));

            expect(screen).toBe(PopupScreen.GlobalError);
        });

        it('global error (with !hasLimitExceededError) beats limit-exceeded and locations', () => {
            const screen = derivePopupScreen(makeDeps({
                hasGlobalError: true,
                hasLimitExceededError: false,
                showLimitExceededScreen: true,
                isOpenLocationsScreen: true,
            }));

            expect(screen).toBe(PopupScreen.GlobalError);
        });

        it('!canControlProxy maps to GlobalError even with no explicit global error', () => {
            const screen = derivePopupScreen(makeDeps({
                canControlProxy: false,
                isOpenLocationsScreen: true,
            }));

            expect(screen).toBe(PopupScreen.GlobalError);
        });

        it('limit-exceeded beats locations and upgrade paywall', () => {
            const screen = derivePopupScreen(makeDeps({
                showLimitExceededScreen: true,
                isOpenLocationsScreen: true,
                isPremiumToken: false,
                renderUpgradeScreen: true,
            }));

            expect(screen).toBe(PopupScreen.LimitExceeded);
        });

        it('locations beats upgrade / stats / profiles', () => {
            const screen = derivePopupScreen(makeDeps({
                isOpenLocationsScreen: true,
                isPremiumToken: false,
                renderUpgradeScreen: true,
                isOpenStatsScreen: true,
                isProfilesScreenOpen: true,
            }));

            expect(screen).toBe(PopupScreen.Locations);
        });

        it('upgrade paywall beats stats and profiles', () => {
            const screen = derivePopupScreen(makeDeps({
                isPremiumToken: false,
                renderUpgradeScreen: true,
                isOpenStatsScreen: true,
                isProfilesScreenOpen: true,
            }));

            expect(screen).toBe(PopupScreen.UpgradeScreen);
        });

        it('stats beats profiles', () => {
            const screen = derivePopupScreen(makeDeps({
                isOpenStatsScreen: true,
                isProfilesScreenOpen: true,
            }));

            expect(screen).toBe(PopupScreen.Stats);
        });

        it('profiles is selected when only its flag is set', () => {
            const screen = derivePopupScreen(makeDeps({
                isProfilesScreenOpen: true,
            }));

            expect(screen).toBe(PopupScreen.Profiles);
        });
    });

    describe('edge cases', () => {
        it('returns NotAuthenticated for unauthenticated user without global error', () => {
            const screen = derivePopupScreen(makeDeps({
                authenticated: false,
                hasGlobalError: false,
            }));

            expect(screen).toBe(PopupScreen.NotAuthenticated);
        });

        it('falls through to Main when global error and limit-exceeded error are present without a limit screen flag', () => {
            const screen = derivePopupScreen(makeDeps({
                hasGlobalError: true,
                hasLimitExceededError: true,
            }));

            // When both global error and limit-exceeded error are present,
            // the global-error branch (hasGlobalError && !hasLimitExceededError)
            // is false, and showLimitExceededScreen defaults to false, so the
            // code falls through to Main. This preserves the pre-refactor
            // behavior — the flag priority was intentionally left unchanged.
            expect(screen).toBe(PopupScreen.Main);
        });

        it('does not show NoLocationsError while searching (notSearchingAndSavedTab=false)', () => {
            const screen = derivePopupScreen(makeDeps({
                filteredLocationsLength: 0,
                notSearchingAndSavedTab: false,
            }));

            expect(screen).toBe(PopupScreen.Main);
        });

        it('upgrade paywall is only for non-premium users', () => {
            const screen = derivePopupScreen(makeDeps({
                isPremiumToken: true,
                renderUpgradeScreen: true,
            }));

            expect(screen).toBe(PopupScreen.Main);
        });
    });
});
