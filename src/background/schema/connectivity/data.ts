import * as v from 'valibot';

import { connectivityStateScheme, CONNECTIVITY_STATE_DEFAULT } from './state';
import { connectivityContextScheme, CONNECTIVITY_CONTEXT_DEFAULTS } from './context';

/**
 * Connectivity FSM persisted data schema.
 */
export const connectivityDataScheme = v.strictObject({
    state: connectivityStateScheme,
    context: connectivityContextScheme,
});

/**
 * {@link connectivityDataScheme} type.
 */
export type ConnectivityData = v.InferOutput<typeof connectivityDataScheme>;

/**
 * Default values for {@link ConnectivityData}.
 */
export const CONNECTIVITY_DATA_DEFAULTS: ConnectivityData = {
    state: CONNECTIVITY_STATE_DEFAULT,
    context: CONNECTIVITY_CONTEXT_DEFAULTS,
};
