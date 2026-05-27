import * as v from 'valibot';

import { ConnectivityStateType } from '../../../common/connectivityState';

/**
 * Connectivity FSM state schema.
 */
export const connectivityStateScheme = v.enum(ConnectivityStateType);

/**
 * Default connectivity FSM state.
 */
export const CONNECTIVITY_STATE_DEFAULT = ConnectivityStateType.Idle;
