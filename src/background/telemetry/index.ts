import { appStatus } from '../appStatus';
import { auth } from '../auth/auth';
import { browserApi } from '../browserApi';
import { credentials } from '../credentials';
import { telemetryProvider } from '../providers/telemetryProvider';
import { settings } from '../settings';

import { Telemetry } from './Telemetry';

// TODO: Instead of re-exporting it, import it directly, because it causes side effects
// which gets imported to the page bundles (AG-42568).
export {
    TelemetryScreenName,
    TelemetryActionName,
    type TelemetryActionToScreenMap,
    type HeaderScreenNames,
    type SidebarLinkItemClickActionNames,
    type DnsServerClickActionNames,
    type FreeGbItemClickActionNames,
    type LocationsTabClickActionNames,
} from './telemetryEnums';

export const telemetry = new Telemetry({
    storage: browserApi.storage,
    telemetryProvider,
    appStatus,
    settings,
    auth,
    credentials,
});
