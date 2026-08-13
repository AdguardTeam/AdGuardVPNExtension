import { type ExperimentSlot } from '../telemetry/telemetryTypes';

/**
 * Type alias for the experiment registry.
 * Maps experiment slots to their experiment IDs.
 */
export type ExperimentRegistry = Readonly<Partial<Record<ExperimentSlot, string>>>;

/**
 * Slot used for the AG-55378 personalized onboarding & paywall experiment.
 */
export const AG55378_ONBOARDING_SLOT: ExperimentSlot = 'experiment_2';

/**
 * Experiment ID sent to the backend for the AG-55378 personalized onboarding test.
 */
export const AG55378_ONBOARDING_EXPERIMENT_ID = 'AG-55378-personalized-onboarding-paywall';

/**
 * Version name returned by the backend for the test (b) variant
 * of the personalized onboarding experiment.
 */
export const AG55378_ONBOARDING_B_VERSION_NAME = 'AG-55378-personalized-onboarding-paywall-b';

/**
 * Registry of active A/B experiments.
 *
 * Each entry maps a fixed Plausible slot (experiment_1/2/3) to an experiment ID.
 * Maximum 3 entries. Add new experiments here when needed.
 *
 * Example: { experiment_1: 'AG-47804-trial-a_def' }
 */
export const EXPERIMENT_REGISTRY: ExperimentRegistry = {
    [AG55378_ONBOARDING_SLOT]: AG55378_ONBOARDING_EXPERIMENT_ID,
};
