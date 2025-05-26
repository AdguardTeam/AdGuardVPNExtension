/**
 * Documentation: projects/JAVA/repos/vpn-endpoint/browse
 */

/**
 * Websocket connectivity info message to refresh tokens.
 */
export interface WsConnectivityInfoMsgRefreshTokens {
    /**
     * If `true`, it means that there were some changes with VPN token
     * or credentials and the client must refresh them.
     */
    refreshTokens: boolean;
}

/**
 * Websocket connectivity info message with traffic statistics.
 *
 * NOTE: Traffic bytes are counted for some period and not absolute,
 * period is determined by the backend server (around 2-3 min).
 */
export interface WsConnectivityInfoMsgTraffic {
    /**
     * Bytes downloaded since the last event.
     */
    bytesDownloaded: number;

    /**
     * Bytes uploaded since the last event.
     */
    bytesUploaded: number;
}

/**
 * Websocket connectivity info message.
 * Periodically sent by websocket with some information about the connection.
 */
export type WsConnectivityInfoMsg =
    | WsConnectivityInfoMsgRefreshTokens
    | WsConnectivityInfoMsgTraffic;
