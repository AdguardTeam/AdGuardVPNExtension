import { browserApi } from '../browserApi';
import { telemetryProvider } from '../providers/telemetryProvider';
import { credentials } from '../credentials';

import { Telemetry } from './Telemetry';

export { TelemetryScreenName, TelemetryActionName } from './telemetryEnums';
export { type TelemetryCustomEventData } from './telemetryTypes';

export const telemetry = new Telemetry({
    storage: browserApi.storage,
    telemetryProvider,
    credentials,
});
