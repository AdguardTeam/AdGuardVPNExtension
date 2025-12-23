import zod from 'zod';

/**
 * Response schema for installation tracking.
 *
 * @property version Experiment variant/version identifier returned by backend.
 * @property completed Whether the backend marks the experiment variant as completed.
 */
export const versionSchema = zod.object({
    version: zod.string().nullish(),
    completed: zod.boolean().nullish(),
});

/**
 * List of experiment versions.
 */
export const versionsSchema = zod.array(versionSchema).nullish();

/**
 * Experiments payload returned by backend.
 *
 * @property selected_versions Selected versions for the current installation (can be missing).
 */
export const experimentsSchema = zod.object({
    selected_versions: versionsSchema,
}).nullish();

/**
 * Response from installation tracking request.
 *
 * @property experiments Experiments payload returned by backend.
 */
export const trackInstallResponseSchema = zod.object({
    experiments: experimentsSchema,
});

export type VersionResponse = zod.infer<typeof versionSchema>;
export type VersionsResponse = zod.infer<typeof versionsSchema>;
export type ExperimentsResponse = zod.infer<typeof experimentsSchema>;
export type TrackInstallResponse = zod.infer<typeof trackInstallResponseSchema>;
