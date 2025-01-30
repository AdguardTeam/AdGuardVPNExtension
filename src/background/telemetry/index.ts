import { Telemetry } from './Telemetry';

export { TelemetryScreenName, TelemetryActionName } from './telemetryEnums';
export { type TelemetryPageViewEventData, type TelemetryCustomEventData } from './telemetryTypes';

export const telemetry = new Telemetry();
