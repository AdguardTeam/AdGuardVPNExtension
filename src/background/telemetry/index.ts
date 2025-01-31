import { browserApi } from '../browserApi';
import { stateStorage } from '../stateStorage';
import { telemetryProvider } from '../providers/telemetryProvider';
import { Prefs } from '../../common/prefs';
import { appStatus } from '../appStatus';

import { Telemetry } from './Telemetry';

export { TelemetryScreenName, TelemetryActionName } from './telemetryEnums';
export { type TelemetrySendCustomEventData } from './telemetryTypes';

export const telemetry = new Telemetry({
    storage: browserApi.storage,
    stateStorage,
    telemetryProvider,
    prefs: Prefs,
    appStatus,
});
