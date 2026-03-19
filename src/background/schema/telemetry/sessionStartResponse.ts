import * as v from 'valibot';

/**
 * Valid experiment slot identifiers.
 */
const experimentSlotSchema = v.union([
    v.literal('experiment_1'),
    v.literal('experiment_2'),
    v.literal('experiment_3'),
]);

/**
 * Schema for a single variant assignment returned by the session_start endpoint.
 */
export const variantAssignmentSchema = v.object({
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
        experimentSlotSchema,
        v.optional(variantAssignmentSchema),
    ),
});

export type VariantAssignment = v.InferOutput<typeof variantAssignmentSchema>;
export type SessionStartResponseSchema = v.InferOutput<typeof sessionStartResponseSchema>;
