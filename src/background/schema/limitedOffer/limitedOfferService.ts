import zod from 'zod';

export const limitedOfferStorageDataScheme = zod.record(zod.number().or(zod.null())).or(zod.null());

export type LimitedOfferStorageData = zod.infer<typeof limitedOfferStorageDataScheme>;
