/**
 * Documentation: projects/JAVA/repos/vpn-endpoint/browse
 */

/**
 * ConnectivityInfoMsg refresh tokens event.
 */
export interface WsConnectivityInfoMsgRefreshTokens {
    /**
     * If `true`, it means that there were some changes with VPN token
     * or credentials and the client must refresh them.
     */
    refreshTokens: boolean;
}

/**
 * ConnectivityInfoMsg stats event.
 *
 * NOTE: Traffic bytes are counted for some period and not absolute.
 */
export interface WsConnectivityInfoMsgStats {
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
 * Periodically sent by websocket with some information about the connection.
 */
export type WsConnectivityInfoMsg =
    | WsConnectivityInfoMsgRefreshTokens
    | WsConnectivityInfoMsgStats;
