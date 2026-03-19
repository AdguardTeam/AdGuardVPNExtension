import * as v from 'valibot';

export const limitedOfferStorageDataScheme = v.nullable(v.record(v.string(), v.nullable(v.number())));

export type LimitedOfferStorageData = v.InferOutput<typeof limitedOfferStorageDataScheme>;
