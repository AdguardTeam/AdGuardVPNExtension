import React from 'react';

import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';
import {
    render,
    fireEvent,
    screen,
    cleanup,
    waitFor,
} from '@testing-library/react';

const setShowOnboarding = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const sendCustomEvent = vi.hoisted(() => vi.fn());
const sendPageViewEvent = vi.hoisted(() => vi.fn());
const uiStoreRef = vi.hoisted(() => ({
    current: null as null | {
        onboardingGoal: OnboardingGoal | null;
        setOnboardingGoal: (goal: OnboardingGoal | null) => Promise<void>;
    },
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
        getPlural: (key: string) => key,
    },
}));

vi.mock('../../../../src/common/messenger', () => ({
    messenger: { setOnboardingGoal: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../../src/popup/stores', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const ReactActual = await vi.importActual<typeof import('react')>('react');
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const { UiStore } = await vi.importActual<typeof import('../../../../src/popup/stores/UiStore')>(
        '../../../../src/popup/stores/UiStore');

    const uiStore = new UiStore({} as never);
    uiStoreRef.current = uiStore;

    return {
        rootStore: ReactActual.createContext({
            authStore: { setShowOnboarding },
            uiStore,
            telemetryStore: { sendCustomEvent, sendPageViewEvent },
        }),
    };
});

// eslint-disable-next-line import/first
import { type OnboardingGoal } from '../../../../src/popup/stores/UiStore';
// eslint-disable-next-line import/first
import { PersonalizedOnboarding } from '../../../../src/popup/components/Authentication/PersonalizedOnboarding';

describe('PersonalizedOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
        uiStoreRef.current?.setOnboardingGoal(null);
    });

    it('sends the choice screen page view on mount with the table screen name', () => {
        render(<PersonalizedOnboarding />);
        expect(sendPageViewEvent).toHaveBeenCalledWith('onboarding_choice_screen');
    });

    it('renders the three goal options', () => {
        render(<PersonalizedOnboarding />);
        expect(screen.getByText('popup_onboarding_choice_privacy')).toBeTruthy();
        expect(screen.getByText('popup_onboarding_choice_streaming')).toBeTruthy();
        expect(screen.getByText('popup_onboarding_choice_bypass')).toBeTruthy();
    });

    it('renders the Other option', () => {
        render(<PersonalizedOnboarding />);
        expect(screen.getByText('popup_onboarding_choice_other')).toBeTruthy();
    });

    it.each([
        {
            goal: 'privacy' as const,
            choiceLabel: 'popup_onboarding_choice_privacy',
            clickAction: 'protect_privacy_click',
            firstSlideTitle: 'popup_onboarding_privacy_1_title',
            lastSlideTitle: 'popup_onboarding_privacy_3_title',
        },
        {
            goal: 'streaming' as const,
            choiceLabel: 'popup_onboarding_choice_streaming',
            clickAction: 'stream_tv_click',
            firstSlideTitle: 'popup_onboarding_streaming_1_title',
            lastSlideTitle: 'popup_onboarding_streaming_3_title',
        },
        {
            goal: 'bypass' as const,
            choiceLabel: 'popup_onboarding_choice_bypass',
            clickAction: 'bypass_censor_click',
            firstSlideTitle: 'popup_onboarding_bypass_1_title',
            lastSlideTitle: 'popup_onboarding_bypass_3_title',
        },
    ])('selecting $goal stores the goal, fires telemetry, and shows goal slides', async ({
        goal,
        choiceLabel,
        clickAction,
        firstSlideTitle,
        lastSlideTitle,
    }) => {
        render(<PersonalizedOnboarding />);
        fireEvent.click(screen.getByText(choiceLabel));

        expect(uiStoreRef.current?.onboardingGoal).toBe(goal);
        expect(sendCustomEvent).toHaveBeenCalledWith(
            clickAction,
            'onboarding_choice_screen',
        );
        expect(screen.getByText(firstSlideTitle)).toBeTruthy();

        // Advance through remaining slides to the final one.
        fireEvent.click(screen.getByText('popup_onboarding_next'));
        await waitFor(() => expect(screen.getByText(
            firstSlideTitle.replace('_1_', '_2_'),
        )).toBeTruthy());
        fireEvent.click(screen.getByText('popup_onboarding_next'));
        await waitFor(() => expect(screen.getByText(lastSlideTitle)).toBeTruthy());

        // Completing the last slide finishes onboarding.
        fireEvent.click(screen.getByText('popup_onboarding_next'));
        await waitFor(() => expect(setShowOnboarding).toHaveBeenCalledWith(false));
    });

    it('closing the choice screen sets goal null and completes onboarding', () => {
        const { container } = render(<PersonalizedOnboarding />);
        const closeBtn = container.querySelector('.close-icon-btn') as HTMLElement;
        fireEvent.click(closeBtn);
        expect(uiStoreRef.current?.onboardingGoal).toBeNull();
        expect(setShowOnboarding).toHaveBeenCalledWith(false);
    });

    it('selecting Other fires telemetry, sets goal null and completes onboarding', async () => {
        render(<PersonalizedOnboarding />);
        fireEvent.click(screen.getByText('popup_onboarding_choice_other'));

        expect(sendCustomEvent).toHaveBeenCalledWith(
            'other_click',
            'onboarding_choice_screen',
        );
        expect(uiStoreRef.current?.onboardingGoal).toBeNull();
        await waitFor(() => expect(setShowOnboarding).toHaveBeenCalledWith(false));
    });
});
