import zod from 'zod';

import { VpnInfoScheme } from './vpnInfo';

export const endpointsStateScheme = zod.object({
    vpnInfo: VpnInfoScheme.optional(),
});

export type EndpointsState = zod.infer<typeof endpointsStateScheme>;
