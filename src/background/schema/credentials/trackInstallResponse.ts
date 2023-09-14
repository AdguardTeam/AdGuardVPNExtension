import zod from 'zod';

export const versionsSchema = zod.array(zod.string()).optional();
export const experimentsSchema = zod.object({
    versions: versionsSchema,
}).optional();

export const trackInstallResponseSchema = zod.object({
    experiments: experimentsSchema,
});

export type VersionsResponse = zod.infer<typeof versionsSchema>;
export type ExperimentsResponse = zod.infer<typeof experimentsSchema>;
export type TrackInstallResponse = zod.infer<typeof trackInstallResponseSchema>;
