import { appStatus } from '../appStatus';
import { auth } from '../auth/auth';
import { browserApi } from '../browserApi';
import { credentials } from '../credentials';
import { telemetryProvider } from '../providers/telemetryProvider';
import { settings } from '../settings';

import { Telemetry } from './Telemetry';

export {
    TelemetryScreenName,
    TelemetryActionName,
    type TelemetryActionToScreenMap,
    type HeaderScreenNames,
    type SidebarLinkItemClickActionNames,
    type DnsServerClickActionNames,
    type FreeGbItemClickActionNames,
} from './telemetryEnums';

export const telemetry = new Telemetry({
    storage: browserApi.storage,
    telemetryProvider,
    appStatus,
    settings,
    auth,
    credentials,
});
