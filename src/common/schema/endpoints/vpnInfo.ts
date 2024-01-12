import zod from 'zod';

export const VpnInfoScheme = zod.object({
    bandwidthFreeMbits: zod.number().optional(),
    premiumPromoPage: zod.string().optional(),
    premiumPromoEnabled: zod.boolean().optional(),
    refreshTokens: zod.boolean().optional(),
    vpnFailurePage: zod.string().optional(),
    usedDownloadedBytes: zod.number().optional(),
    usedUploadedBytes: zod.number().optional(),
    maxDownloadedBytes: zod.number().optional(),
    maxUploadedBytes: zod.number().optional(),
    renewalTrafficDate: zod.string().optional(),
    maxDevicesCount: zod.number().optional(),
    emailConfirmationRequired: zod.boolean().optional(),
}).strict();

export type VpnExtensionInfoInterface = zod.infer<typeof VpnInfoScheme>;
