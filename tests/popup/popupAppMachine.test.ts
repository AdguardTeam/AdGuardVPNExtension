import { describe, it, expect } from 'vitest';
import { interpret, type AnyEventObject, type InterpreterFrom } from 'xstate';

import { popupAppMachine } from '../../src/popup/components/App/popupAppMachine';
import {
    PopupEvent,
    PopupGuard,
    PopupService,
    PopupState,
} from '../../src/popup/components/App/popupAppMachineEnums';

/**
 * Creates an interpreted machine with stub services and guards for testing.
 * All services resolve immediately by default; individual tests override as needed.
 *
 * @param overrides Partial services/guards to override defaults.
 * @returns Started interpreter.
 */
function createTestMachine(overrides: {
    services?: Partial<Record<PopupService, () => Promise<unknown>>>;
    guards?: Partial<Record<PopupGuard, (ctx: unknown, event: AnyEventObject) => boolean>>;
} = {}): InterpreterFrom<typeof popupAppMachine> {
    const defaultServices = {
        [PopupService.LoadPlatformData]: () => Promise.resolve(),
        [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: false }),
        [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
        [PopupService.LoadPopupData]: () => Promise.resolve(),
    };

    const defaultGuards = {
        [PopupGuard.IsAuthenticated]: (_ctx: unknown, event: AnyEventObject) => {
            return event.data?.isAuthenticated === true;
        },
        [PopupGuard.ShouldShowOnboarding]: (_ctx: unknown, event: AnyEventObject) => {
            return event.data?.shouldShowOnboarding === true;
        },
    };

    const machine = popupAppMachine.withConfig({
        services: { ...defaultServices, ...overrides.services },
        guards: { ...defaultGuards, ...overrides.guards },
    });

    return interpret(machine).start();
}

/**
 * Waits for the machine to reach a specific state.
 *
 * @param service Interpreter instance.
 * @param targetState The state value to wait for.
 * @returns Promise that resolves when the target state is reached.
 */
function waitForState(
    service: InterpreterFrom<typeof popupAppMachine>,
    targetState: PopupState,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const TIMEOUT_MS = 2000;

        const timer = setTimeout(() => {
            reject(new Error(
                `Timed out waiting for state "${targetState}". Current state: "${service.state.value}"`,
            ));
        }, TIMEOUT_MS);

        if (service.state.matches(targetState)) {
            clearTimeout(timer);
            resolve();
            return;
        }

        service.onTransition((state) => {
            if (state.matches(targetState)) {
                clearTimeout(timer);
                resolve();
            }
        });
    });
}

describe('popupAppMachine', () => {
    describe('initial state', () => {
        it('should start in idle state', () => {
            const service = createTestMachine();

            expect(service.state.matches(PopupState.Idle)).toBe(true);

            service.stop();
        });
    });

    describe('happy path — authenticated, no onboarding', () => {
        it('should reach showingPopup when user is authenticated and no onboarding needed', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingPopup);

            expect(service.state.matches(PopupState.ShowingPopup)).toBe(true);

            service.stop();
        });
    });

    describe('happy path — unauthenticated', () => {
        it('should reach showingAuthScreen when user is not authenticated', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingAuthScreen);

            expect(service.state.matches(PopupState.ShowingAuthScreen)).toBe(true);

            service.stop();
        });

        it('should transition from showingAuthScreen to loadingStartupData on USER_AUTHENTICATED', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: false }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingAuthScreen);

            service.send(PopupEvent.UserAuthenticated);
            await waitForState(service, PopupState.ShowingPopup);

            expect(service.state.matches(PopupState.ShowingPopup)).toBe(true);

            service.stop();
        });
    });

    describe('onboarding flow', () => {
        it('should reach showingOnboarding when startup data indicates onboarding needed', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: true }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingOnboarding);

            expect(service.state.matches(PopupState.ShowingOnboarding)).toBe(true);

            service.stop();
        });

        it('should transition from showingOnboarding to loadingPopupData on ONBOARDING_COMPLETE', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: true }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingOnboarding);

            service.send(PopupEvent.OnboardingComplete);
            await waitForState(service, PopupState.ShowingPopup);

            expect(service.state.matches(PopupState.ShowingPopup)).toBe(true);

            service.stop();
        });
    });

    describe('error handling', () => {
        it('should transition to error when loadPlatformData fails', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadPlatformData]: () => Promise.reject(new Error('platform error')),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.Error);

            expect(service.state.matches(PopupState.Error)).toBe(true);

            service.stop();
        });

        it('should transition to error when loadAuthStatus fails', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.reject(new Error('auth error')),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.Error);

            expect(service.state.matches(PopupState.Error)).toBe(true);

            service.stop();
        });

        it('should transition to error when loadStartupData fails', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.reject(new Error('startup error')),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.Error);

            expect(service.state.matches(PopupState.Error)).toBe(true);

            service.stop();
        });

        it('should transition to error when loadPopupData fails', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                    [PopupService.LoadPopupData]: () => Promise.reject(new Error('popup data error')),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.Error);

            expect(service.state.matches(PopupState.Error)).toBe(true);

            service.stop();
        });
    });

    describe('retry from error', () => {
        it('should restart full init sequence from loadingPlatformData on RETRY', async () => {
            let popupDataCallCount = 0;
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                    [PopupService.LoadPopupData]: () => {
                        popupDataCallCount += 1;
                        if (popupDataCallCount === 1) {
                            return Promise.reject(new Error('first attempt failed'));
                        }
                        return Promise.resolve();
                    },
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.Error);

            expect(service.state.matches(PopupState.Error)).toBe(true);

            service.send(PopupEvent.Retry);
            await waitForState(service, PopupState.ShowingPopup);

            expect(service.state.matches(PopupState.ShowingPopup)).toBe(true);

            service.stop();
        });

        it('should recover from early-stage failure via full restart', async () => {
            let authCallCount = 0;
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => {
                        authCallCount += 1;
                        if (authCallCount === 1) {
                            return Promise.reject(new Error('auth check failed'));
                        }
                        return Promise.resolve({ isAuthenticated: true });
                    },
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.Error);

            expect(service.state.matches(PopupState.Error)).toBe(true);

            service.send(PopupEvent.Retry);
            await waitForState(service, PopupState.ShowingPopup);

            expect(service.state.matches(PopupState.ShowingPopup)).toBe(true);

            service.stop();
        });

        it('should transition back to error if retry also fails', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                    [PopupService.LoadPopupData]: () => Promise.reject(new Error('always fails')),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.Error);

            service.send(PopupEvent.Retry);
            await waitForState(service, PopupState.Error);

            expect(service.state.matches(PopupState.Error)).toBe(true);

            service.stop();
        });
    });

    describe('deauthentication', () => {
        it('should transition from showingPopup to showingAuthScreen on USER_DEAUTHENTICATED', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingPopup);

            service.send(PopupEvent.UserDeauthenticated);

            expect(service.state.matches(PopupState.ShowingAuthScreen)).toBe(true);

            service.stop();
        });

        it('should transition from showingOnboarding to showingAuthScreen on USER_DEAUTHENTICATED', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: true }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingOnboarding);

            service.send(PopupEvent.UserDeauthenticated);

            expect(service.state.matches(PopupState.ShowingAuthScreen)).toBe(true);

            service.stop();
        });

        it('should allow re-authentication after deauthentication', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingPopup);

            service.send(PopupEvent.UserDeauthenticated);
            expect(service.state.matches(PopupState.ShowingAuthScreen)).toBe(true);

            service.send(PopupEvent.UserAuthenticated);
            await waitForState(service, PopupState.ShowingPopup);

            expect(service.state.matches(PopupState.ShowingPopup)).toBe(true);

            service.stop();
        });
    });

    describe('ignored events', () => {
        it('should ignore USER_AUTHENTICATED when not in showingAuthScreen', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: true }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingPopup);

            // Send event that's not valid in this state — should be ignored
            service.send(PopupEvent.UserAuthenticated);

            expect(service.state.matches(PopupState.ShowingPopup)).toBe(true);

            service.stop();
        });

        it('should ignore ONBOARDING_COMPLETE when not in showingOnboarding', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingAuthScreen);

            service.send(PopupEvent.OnboardingComplete);

            expect(service.state.matches(PopupState.ShowingAuthScreen)).toBe(true);

            service.stop();
        });

        it('should ignore RETRY when not in error state', async () => {
            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: false }),
                },
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingAuthScreen);

            service.send(PopupEvent.Retry);

            expect(service.state.matches(PopupState.ShowingAuthScreen)).toBe(true);

            service.stop();
        });
    });

    describe('full auth → onboarding → popup flow', () => {
        it('should go through the complete flow: auth → onboarding → popup', async () => {
            const visitedStates: string[] = [];

            const service = createTestMachine({
                services: {
                    [PopupService.LoadAuthStatus]: () => Promise.resolve({ isAuthenticated: false }),
                    [PopupService.LoadStartupData]: () => Promise.resolve({ shouldShowOnboarding: true }),
                },
            });

            service.onTransition((state) => {
                const value = state.value as string;
                if (!visitedStates.includes(value)) {
                    visitedStates.push(value);
                }
            });

            service.send(PopupEvent.Init);
            await waitForState(service, PopupState.ShowingAuthScreen);

            service.send(PopupEvent.UserAuthenticated);
            await waitForState(service, PopupState.ShowingOnboarding);

            service.send(PopupEvent.OnboardingComplete);
            await waitForState(service, PopupState.ShowingPopup);

            expect(visitedStates).toContain(PopupState.Idle);
            expect(visitedStates).toContain(PopupState.LoadingPlatformData);
            expect(visitedStates).toContain(PopupState.LoadingAuthStatus);
            expect(visitedStates).toContain(PopupState.ShowingAuthScreen);
            expect(visitedStates).toContain(PopupState.LoadingStartupData);
            expect(visitedStates).toContain(PopupState.ShowingOnboarding);
            expect(visitedStates).toContain(PopupState.LoadingPopupData);
            expect(visitedStates).toContain(PopupState.ShowingPopup);
            expect(visitedStates).not.toContain(PopupState.Error);

            service.stop();
        });
    });
});
