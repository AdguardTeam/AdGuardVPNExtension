import zod from 'zod';

import { SERVICES_DEFAULTS, exclusionsServicesScheme } from './services/servicesManager';
import { EXCLUSIONS_DEFAULTS, exclusionsScheme } from './exclusions/exclusionsManager';

export const exclusionsStateScheme = zod.object({
    exclusions: exclusionsScheme,
    services: exclusionsServicesScheme,
}).strict();

export type ExclusionsState = zod.infer<typeof exclusionsStateScheme>;

export const EXCLUSIONS_STATE_DEFAULTS: ExclusionsState = {
    exclusions: EXCLUSIONS_DEFAULTS,
    services: SERVICES_DEFAULTS,
};
