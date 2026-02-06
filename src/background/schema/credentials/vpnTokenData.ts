import * as v from 'valibot';

import { SubscriptionType } from '../../../common/constants';

const vpnSubscriptionScheme = v.object({
    next_bill_date_iso: v.string(),
    duration_v2: v.enum(SubscriptionType),
});

export const vpnTokenDataScheme = v.object({
    token: v.string(),
    licenseStatus: v.string(),
    timeExpiresSec: v.number(),
    timeExpiresIso: v.string(),
    licenseKey: v.nullable(v.string()),
    vpnSubscription: v.nullable(vpnSubscriptionScheme),
});

export type VpnTokenData = v.InferOutput<typeof vpnTokenDataScheme>;
