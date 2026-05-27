import * as v from 'valibot';

import { profileSettingsScheme } from './profileSettings';

/**
 * Valibot schema for a single profile.
 */
export const profileScheme = v.strictObject({
    /**
     * Unique identifier (nanoid for custom profiles, DEFAULT_PROFILE_ID for the system profile).
     */
    id: v.string(),

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

/**
 * Lightweight profile descriptor without settings.
 */
export type ProfileInfo = Pick<Profile, 'id' | 'name'>;
