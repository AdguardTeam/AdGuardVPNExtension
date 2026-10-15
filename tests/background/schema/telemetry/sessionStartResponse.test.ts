import { describe, it, expect } from 'vitest';
import * as v from 'valibot';

import {
    sessionStartResponseSchema,
    variantAssignmentSchema,
} from '../../../../src/background/schema/telemetry/sessionStartResponse';

describe('variantAssignmentSchema', () => {
    it('should accept a non-empty version_name', () => {
        const result = v.safeParse(variantAssignmentSchema, {
            experiment_name: 'AG-001-feature-a',
            version_name: 'b',
        });

        expect(result.success).toBe(true);
    });

    it('should reject an empty version_name', () => {
        const result = v.safeParse(variantAssignmentSchema, {
            experiment_name: 'AG-001-feature-a',
            version_name: '',
        });

        expect(result.success).toBe(false);
    });
});

describe('sessionStartResponseSchema', () => {
    it('should accept an assignment with an empty version_name', () => {
        const result = v.safeParse(sessionStartResponseSchema, {
            versions: {
                experiment_1: {
                    experiment_name: 'AG-001-feature-a',
                    version_name: '',
                },
            },
        });

        expect(result.success).toBe(true);
    });

    it('should accept an unknown slot key', () => {
        const result = v.safeParse(sessionStartResponseSchema, {
            versions: {
                experiment_4: {
                    experiment_name: 'AG-004-feature-d',
                    version_name: 'b',
                },
            },
        });

        expect(result.success).toBe(true);
    });
});
