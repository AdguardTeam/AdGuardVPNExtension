import zod from 'zod';

import { connectivityStateScheme, CONNECTIVITY_STATE_DEFAULT } from './state';
import { connectivityContextScheme, CONNECTIVITY_CONTEXT_DEFAULTS } from './context';

/**
 * Connectivity FSM persisted data schema.
 */
export const connectivityDataScheme = zod.object({
    state: connectivityStateScheme,
    context: connectivityContextScheme,
}).strict();

/**
 * {@link connectivityDataScheme} type.
 */
export type ConnectivityData = zod.infer<typeof connectivityDataScheme>;

/**
 * Default values for {@link ConnectivityData}.
 */
export const CONNECTIVITY_DATA_DEFAULTS: ConnectivityData = {
    state: CONNECTIVITY_STATE_DEFAULT,
    context: CONNECTIVITY_CONTEXT_DEFAULTS,
};
