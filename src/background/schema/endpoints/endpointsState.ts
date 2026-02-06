import * as v from 'valibot';

import { VpnInfoScheme } from '../../../common/schema/endpoints/vpnInfo';

export const endpointsStateScheme = v.object({
    vpnInfo: v.nullable(VpnInfoScheme),
});

export type EndpointsState = v.InferOutput<typeof endpointsStateScheme>;

export const ENDPOINTS_STATE_DEFAULTS = {
    vpnInfo: null,
};
