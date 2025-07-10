// eslint-disable-next-line import/no-cycle
import { endpointConnectivity } from './endpointConnectivity';

export { type ConnectivityStateChangeEvent } from './connectivityService/main';
export {
    type WsConnectivityInfoMsgRefreshTokens,
    type WsConnectivityInfoMsgTraffic,
    type WsConnectivityInfoMsg,
} from './endpointConnectivity/wsConnectivityInfoMsg';

export const connectivity = {
    endpointConnectivity,
};
