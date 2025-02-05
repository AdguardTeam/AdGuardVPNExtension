import { browserApi } from '../browserApi';
import { telemetryProvider } from '../providers/telemetryProvider';

import { Telemetry } from './Telemetry';

export { TelemetryScreenName, TelemetryActionName } from './telemetryEnums';

export const telemetry = new Telemetry({
    storage: browserApi.storage,
    telemetryProvider,
});
