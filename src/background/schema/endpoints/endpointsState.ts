import zod from 'zod';

import { VpnInfoScheme } from './vpnInfo';

export const endpointsStateScheme = zod.object({
    vpnInfo: VpnInfoScheme.optional().or(zod.null()),
});

export type EndpointsState = zod.infer<typeof endpointsStateScheme>;
