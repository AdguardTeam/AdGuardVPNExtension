import zod from 'zod';

import { SubscriptionType } from '../../../common/constants';

const vpnSubscriptionScheme = zod.object({
    next_bill_date_iso: zod.string(),
    duration_v2: zod.nativeEnum(SubscriptionType),
});

export const vpnTokenDataScheme = zod.object({
    token: zod.string(),
    licenseStatus: zod.string(),
    timeExpiresSec: zod.number(),
    timeExpiresIso: zod.string(),
    licenseKey: zod.string().nullable(),
    vpnSubscription: vpnSubscriptionScheme.or(zod.null()),
});

export type VpnTokenData = zod.infer<typeof vpnTokenDataScheme>;
