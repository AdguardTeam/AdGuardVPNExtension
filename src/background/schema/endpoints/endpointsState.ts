import zod from 'zod';

import { VpnInfoScheme } from '../../../common/schema/endpoints/vpnInfo';

export const endpointsStateScheme = zod.object({
    vpnInfo: VpnInfoScheme.or(zod.null()),
});

export type EndpointsState = zod.infer<typeof endpointsStateScheme>;

export const ENDPOINTS_STATE_DEFAULTS = {
    vpnInfo: null,
};
