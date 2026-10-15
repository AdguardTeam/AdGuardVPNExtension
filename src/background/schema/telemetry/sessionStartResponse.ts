import * as v from 'valibot';

/**
 * Valid experiment slot identifiers.
 * Slots are fixed Plausible custom-property slots available in the telemetry
 * service: `experiment_1`..`experiment_3`.
 */
export const experimentSlotSchema = v.picklist([
    'experiment_1',
    'experiment_2',
    'experiment_3',
]);

/**
 * Schema for a single variant assignment returned by the session_start endpoint.
 * `experiment_name` must echo the experiment ID sent in the `tests` payload.
 * `version_name` is not length-validated here so a malformed slot
 * does not reject the whole response; each assignment is validated
 * before being cached.
 */
const sessionStartVariantAssignmentSchema = v.object({
    experiment_name: v.string(),
    version_name: v.string(),
});

/**
 * Schema for the /api/v1/session_start response.
 *
 * The `versions` object maps experiment slot keys to variant assignments.
 * An empty `versions: {}` is valid and means no experiments are active.
 */
export const sessionStartResponseSchema = v.object({
    versions: v.record(
        v.string(),
        v.optional(sessionStartVariantAssignmentSchema),
    ),
});

/**
 * Schema for a valid variant assignment stored in the cache.
 * Reuses the response assignment shape and requires a non-empty `version_name`.
 */
export const variantAssignmentSchema = v.object({
    ...sessionStartVariantAssignmentSchema.entries,
    version_name: v.pipe(v.string(), v.minLength(1)),
});

export type ExperimentSlot = v.InferOutput<typeof experimentSlotSchema>;
export type VariantAssignment = v.InferOutput<typeof variantAssignmentSchema>;
export type SessionStartResponse = v.InferOutput<typeof sessionStartResponseSchema>;
