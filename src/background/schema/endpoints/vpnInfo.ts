import zod from 'zod';

export const VpnInfoScheme = zod.object({
    bandwidthFreeMbits: zod.number(),
    premiumPromoPage: zod.string(),
    premiumPromoEnabled: zod.boolean(),
    refreshTokens: zod.boolean(),
    vpnFailurePage: zod.string(),
    usedDownloadedBytes: zod.number(),
    usedUploadedBytes: zod.number(),
    maxDownloadedBytes: zod.number(),
    maxUploadedBytes: zod.number(),
    renewalTrafficDate: zod.string(),
    maxDevicesCount: zod.number(),
    emailConfirmationRequired: zod.boolean(),
}).strict();

export type VpnExtensionInfoInterface = zod.infer<typeof VpnInfoScheme>;
