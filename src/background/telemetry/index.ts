import { browserApi } from '../browserApi';
import { telemetryProvider } from '../providers/telemetryProvider';

import { Telemetry } from './Telemetry';

export { TelemetryScreenName, TelemetryActionName } from './telemetryEnums';
export { type TelemetrySendCustomEventData } from './telemetryTypes';

export const telemetry = new Telemetry({
    telemetryProvider,
    browserApi,
});
