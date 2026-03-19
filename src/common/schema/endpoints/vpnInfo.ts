import * as v from 'valibot';

export const VpnInfoScheme = v.strictObject({
    bandwidthFreeMbits: v.optional(v.number()),
    premiumPromoPage: v.optional(v.string()),
    premiumPromoEnabled: v.optional(v.boolean()),
    refreshTokens: v.optional(v.boolean()),
    vpnFailurePage: v.optional(v.string()),
    usedDownloadedBytes: v.optional(v.number()),
    usedUploadedBytes: v.optional(v.number()),
    maxDownloadedBytes: v.optional(v.number()),
    maxUploadedBytes: v.optional(v.number()),
    renewalTrafficDate: v.optional(v.string()),
    maxDevicesCount: v.optional(v.number()),
    emailConfirmationRequired: v.optional(v.boolean()),
});

export type VpnExtensionInfoInterface = v.InferOutput<typeof VpnInfoScheme>;
