import * as v from 'valibot';

/**
 * Response schema for installation tracking.
 *
 * @property version Experiment variant/version identifier returned by backend.
 * @property completed Whether the backend marks the experiment variant as completed.
 */
export const versionSchema = v.object({
    version: v.nullish(v.string()),
    completed: v.nullish(v.boolean()),
});

/**
 * List of experiment versions.
 */
export const versionsSchema = v.nullish(v.array(versionSchema));

/**
 * Experiments payload returned by backend.
 *
 * @property selected_versions Selected versions for the current installation (can be missing).
 */
export const experimentsSchema = v.nullish(v.object({
    selected_versions: versionsSchema,
}));

/**
 * Response from installation tracking request.
 *
 * @property experiments Experiments payload returned by backend.
 */
export const trackInstallResponseSchema = v.object({
    experiments: experimentsSchema,
});

export type VersionResponse = v.InferOutput<typeof versionSchema>;
export type VersionsResponse = v.InferOutput<typeof versionsSchema>;
export type ExperimentsResponse = v.InferOutput<typeof experimentsSchema>;
export type TrackInstallResponse = v.InferOutput<typeof trackInstallResponseSchema>;
