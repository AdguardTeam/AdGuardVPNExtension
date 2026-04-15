import * as v from 'valibot';

import { profileSettingsScheme } from './profileSettings';

/**
 * Discriminator for system vs user-created profiles.
 */
export enum ProfileKind {
    Default = 'default',
    Custom = 'custom',
}

/**
 * Valibot schema for a single profile.
 */
export const profileScheme = v.strictObject({
    /**
     * Unique identifier (nanoid).
     */
    id: v.string(),

    /**
     * Whether this is the system default profile or a user-created one.
     */
    kind: v.enum_(ProfileKind),

    /**
     * Display name chosen by the user.
     * For the system profile this is an empty string;
     * the visible name is resolved via localization on the UI side.
     */
    name: v.string(),

    /**
     * VPN settings snapshot for this profile.
     */
    settings: profileSettingsScheme,
});

/**
 * A single VPN profile.
 */
export type Profile = v.InferOutput<typeof profileScheme>;
