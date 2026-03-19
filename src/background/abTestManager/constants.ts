import { type ExperimentSlot } from '../telemetry/telemetryTypes';

/**
 * Type alias for the experiment registry.
 * Maps experiment slots to their experiment IDs.
 */
export type ExperimentRegistry = Readonly<Partial<Record<ExperimentSlot, string>>>;

/**
 * Slot used for the AG-49792 paywall experiment.
 */
export const AG49792_PAYWALL_SLOT: ExperimentSlot = 'experiment_1';

/**
 * Experiment ID sent to the backend for the AG-49792 paywall test.
 */
export const AG49792_PAYWALL_EXPERIMENT_ID = 'AG-49792-data-limit-screens';

/**
 * Version name returned by the backend for the B variant of the paywall test.
 */
export const AG49792_PAYWALL_B_VERSION_NAME = 'AG-49792-data-limit-screens-b';

/**
 * Registry of active A/B experiments.
 *
 * Each entry maps a fixed Plausible slot (experiment_1/2/3) to an experiment ID.
 * Maximum 3 entries. Add new experiments here when needed.
 *
 * Example: { experiment_1: 'AG-47804-trial-a_def' }
 */
export const EXPERIMENT_REGISTRY: ExperimentRegistry = {
    [AG49792_PAYWALL_SLOT]: AG49792_PAYWALL_EXPERIMENT_ID,
};
