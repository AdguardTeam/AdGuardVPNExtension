import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';

const setOnboardingGoal = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
vi.mock('../../../src/common/messenger', () => ({ messenger: { setOnboardingGoal } }));

// eslint-disable-next-line import/first
import { UiStore } from '../../../src/popup/stores/UiStore';
// eslint-disable-next-line import/first
import { FLAGS_FIELDS } from '../../../src/common/constants';
// eslint-disable-next-line import/first
import {
    AG55378_ONBOARDING_SLOT,
    AG55378_ONBOARDING_B_VERSION_NAME,
} from '../../../src/background/abTestManager/constants';

const makeStore = (): UiStore => {
    // rootStore is only stored, not used by the fields under test
    return new UiStore({} as never);
};

describe('UiStore personalized onboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('isPersonalizedOnboardingVariant is false by default (non-personalized is default)', () => {
        const store = makeStore();
        expect(store.isPersonalizedOnboardingVariant).toBe(false);
    });

    it('isPersonalizedOnboardingVariant stays false when no variant is assigned', () => {
        const store = makeStore();
        store.setExperimentVariants({});
        expect(store.isPersonalizedOnboardingVariant).toBe(false);
    });

    it('isPersonalizedOnboardingVariant is true only when the b version is assigned', () => {
        const store = makeStore();
        store.setExperimentVariants({ [AG55378_ONBOARDING_SLOT]: AG55378_ONBOARDING_B_VERSION_NAME });
        expect(store.isPersonalizedOnboardingVariant).toBe(true);
    });

    it('onboardingGoal defaults to null and can be set', async () => {
        const store = makeStore();
        expect(store.onboardingGoal).toBeNull();
        await store.setOnboardingGoal('privacy');
        expect(store.onboardingGoal).toBe('privacy');
        await store.setOnboardingGoal(null);
        expect(store.onboardingGoal).toBeNull();
    });

    it('setOnboardingGoal persists the selected goal atomically', async () => {
        const store = makeStore();
        await store.setOnboardingGoal('streaming');

        expect(setOnboardingGoal).toHaveBeenCalledTimes(1);
        expect(setOnboardingGoal).toHaveBeenCalledWith('streaming');
    });

    it('setOnboardingGoalFromFlags restores the goal from flags storage', () => {
        const store = makeStore();
        store.setOnboardingGoalFromFlags({
            [FLAGS_FIELDS.ONBOARDING_GOAL_PRIVACY]: false,
            [FLAGS_FIELDS.ONBOARDING_GOAL_STREAMING]: true,
            [FLAGS_FIELDS.ONBOARDING_GOAL_BYPASS]: false,
        });
        expect(store.onboardingGoal).toBe('streaming');
    });

    it('setOnboardingGoalFromFlags restores null when no goal flag is set', () => {
        const store = makeStore();
        store.setOnboardingGoalFromFlags({
            [FLAGS_FIELDS.ONBOARDING_GOAL_PRIVACY]: false,
            [FLAGS_FIELDS.ONBOARDING_GOAL_STREAMING]: false,
            [FLAGS_FIELDS.ONBOARDING_GOAL_BYPASS]: false,
        });
        expect(store.onboardingGoal).toBeNull();
    });
});
