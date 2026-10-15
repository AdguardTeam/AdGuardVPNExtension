import * as v from 'valibot';

import { dnsServerDataScheme } from '../dns';
import { exclusionsSnapshotScheme } from '../exclusions';

/**
 * Per-profile runtime data persisted in session storage.
 * Each field is a typed per-profile store (profileId → value).
 * Members are optional with defaults so adding a new member later does not
 * fail validation of already-saved states (matches the `lastUpdateLocale`
 * migration pattern).
 *
 * Note: the previous undo data (legacy `exclusionsState` snapshots and
 * `dnsState.backupDnsServersData`) is temporary and is not migrated here
 * on extension update — it is dropped intentionally.
 */
export const profileSessionStateScheme = v.object({
    dnsBackup: v.optional(v.record(v.string(), v.array(dnsServerDataScheme)), {}),
    exclusionsSnapshots: v.optional(v.record(v.string(), exclusionsSnapshotScheme), {}),
});

/**
 * Profile session state inferred from {@link profileSessionStateScheme}.
 */
export type ProfileSessionState = v.InferOutput<typeof profileSessionStateScheme>;

/**
 * Default values for the profile session state.
 */
export const PROFILE_SESSION_STATE_DEFAULTS: ProfileSessionState = {
    dnsBackup: {},
    exclusionsSnapshots: {},
};
