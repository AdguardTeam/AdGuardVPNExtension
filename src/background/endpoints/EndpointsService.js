import isEqual from 'lodash/isEqual';
import _ from 'lodash';
import qs from 'qs';
import log from '../../lib/logger';
import { getClosestEndpointByCoordinates } from '../../lib/helpers';
import { MESSAGES_TYPES } from '../../lib/constants';
import { POPUP_DEFAULT_SUPPORT_URL } from '../config';
import EndpointsManager from './EndpointsManager';
import notifier from '../../lib/notifier';

/**
 * Endpoint information
 * @typedef {Object} Endpoint
 * @property {string} id
 * @property {string} cityName
 * @property {string} countryCode
 * @property {string} countryName
 * @property {string} domainName
 * @property {[number, number]} coordinates
 * @property {boolean} premiumOnly
 * @property {string} publicKey
 */

/**
 * EndpointsService manages endpoints, vpn, current location information.
 */
class EndpointsService {
    vpnInfo = null;

    currentLocation = null;

    constructor({
        browserApi, proxy, credentials, connectivity, vpnProvider,
    }) {
        this.browserApi = browserApi;
        this.proxy = proxy;
        this.credentials = credentials;
        this.connectivity = connectivity;
        this.vpnProvider = vpnProvider;
        this.endpointsManager = new EndpointsManager(browserApi, connectivity);

        notifier.addSpecifiedListener(
            notifier.types.SHOULD_REFRESH_TOKENS,
            this.refreshTokens.bind(this)
        );
    }

    /**
     * Reconnects to the new endpoint
     * @param {Endpoint} endpoint
     * @returns {Promise<void>}
     */
    reconnectEndpoint = async (endpoint) => {
        const { domainName } = await this.proxy.setCurrentEndpoint(endpoint);
        const { prefix, token } = await this.credentials.getAccessCredentials();
        const wsHost = `${prefix}.${domainName}`;
        await this.connectivity.endpointConnectivity.setCredentials(wsHost, domainName, token);
        log.debug(`Reconnect endpoint from ${endpoint.id} to same city ${endpoint.id}`);
    };


    /**
     * Returns closest endpoint, firstly checking if endpoints object includes
     * endpoint with same city name
     * @param {Object.<Endpoint>} endpoints - endpoints stored by endpoint id
     * @param {Endpoint} currentEndpoint
     * @returns {Endpoint}
     */
    getClosestEndpoint = (endpoints, currentEndpoint) => {
        const endpointsArr = Object.values(endpoints);

        const sameCityEndpoint = endpointsArr.find((endpoint) => {
            return endpoint.cityName === currentEndpoint.cityName;
        });

        if (sameCityEndpoint) {
            return sameCityEndpoint;
        }

        return getClosestEndpointByCoordinates(currentEndpoint, endpointsArr);
    };

    getEndpointsRemotely = async () => {
        let vpnToken;

        try {
            vpnToken = await this.credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints token because: ', e.message);
            return null;
        }

        const newEndpoints = await this.vpnProvider.getEndpoints(vpnToken.token);

        if (newEndpoints) {
            this.endpointsManager.setEndpoints(newEndpoints);
        }

        return newEndpoints;
    };

    vpnTokenChanged = (oldVpnToken, newVpnToken) => {
        return oldVpnToken.licenseKey !== newVpnToken.licenseKey;
    };

    /**
     * Updates vpn tokens and credentials
     * @returns {Promise<{vpnToken: *, vpnCredentials: *}>}
     */
    refreshTokens = async () => {
        log.info('Refreshing tokens');
        const vpnToken = await this.credentials.gainValidVpnToken(true, false);
        const vpnCredentials = await this.credentials.gainValidVpnCredentials(true, false);
        log.info('Tokens and credentials refreshed successfully');
        return { vpnToken, vpnCredentials };
    };

    getVpnInfoRemotely = async () => {
        let vpnToken;

        try {
            vpnToken = await this.credentials.gainValidVpnToken();
        } catch (e) {
            log.debug('Unable to get endpoints info because: ', e.message);
            throw e;
        }

        let vpnInfo = await this.vpnProvider.getVpnExtensionInfo(vpnToken.token);
        let shouldReconnect = false;

        if (vpnInfo.refreshTokens) {
            let updatedVpnToken;

            try {
                ({ vpnToken: updatedVpnToken } = await this.refreshTokens());
            } catch (e) {
                log.debug('Unable to refresh tokens');
            }

            if (this.vpnTokenChanged(vpnToken, updatedVpnToken)) {
                shouldReconnect = true;
            }

            vpnInfo = await this.vpnProvider.getVpnExtensionInfo(updatedVpnToken.token);
        }

        // update endpoints
        const endpoints = await this.getEndpointsRemotely();

        const currentEndpoint = await this.proxy.getCurrentEndpoint();

        if ((endpoints && !_.isEmpty(endpoints)) && currentEndpoint) {
            const currentEndpointInEndpoints = currentEndpoint && Object.keys(endpoints)
                .some((endpointId) => endpointId === currentEndpoint.id);

            // if there is no currently connected endpoint in the list of endpoints,
            // get closest and reconnect
            if (!currentEndpointInEndpoints) {
                const closestEndpoint = this.getClosestEndpoint(endpoints, currentEndpoint);
                this.reconnectEndpoint(closestEndpoint);
                shouldReconnect = false;
            }
        }

        if (shouldReconnect) {
            const closestEndpoint = this.getClosestEndpoint(endpoints, currentEndpoint);
            this.reconnectEndpoint(closestEndpoint);
        }

        this.vpnInfo = vpnInfo;

        await this.browserApi.runtime.sendMessage({
            type: MESSAGES_TYPES.VPN_INFO_UPDATED,
            data: vpnInfo,
        });
    };

    getVpnInfo = () => {
        this.getVpnInfoRemotely();

        if (this.vpnInfo) {
            return this.vpnInfo;
        }
        return null;
    };

    getEndpoints = () => {
        const currentEndpoint = this.proxy.getCurrentEndpoint();
        const currentEndpointPing = this.connectivity.endpointConnectivity.getPing();
        return this.endpointsManager.getEndpoints(currentEndpoint, currentEndpointPing);
    };

    getCurrentLocationRemote = async () => {
        const MIDDLE_OF_EUROPE = { coordinates: [51.05, 13.73] }; // Chosen approximately
        let currentLocation;
        try {
            currentLocation = await this.vpnProvider.getCurrentLocation();
        } catch (e) {
            log.error(e.message);
        }

        // if current location wasn't received use predefined
        currentLocation = currentLocation || MIDDLE_OF_EUROPE;

        if (!isEqual(this.currentLocation, currentLocation)) {
            this.currentLocation = currentLocation;
        }

        return currentLocation;
    };

    getCurrentLocation = () => {
        // update current location information in background
        this.getCurrentLocationRemote();
        if (this.currentLocation) {
            return this.currentLocation;
        }
        return null;
    };

    getSelectedEndpoint = async () => {
        const proxySelectedEndpoint = await this.proxy.getCurrentEndpoint();

        // if found return
        if (proxySelectedEndpoint) {
            return proxySelectedEndpoint;
        }

        const currentLocation = this.getCurrentLocation();
        const endpoints = Object.values(this.endpointsManager.getAll());

        if (!currentLocation || _.isEmpty(endpoints)) {
            return null;
        }

        const closestEndpoint = getClosestEndpointByCoordinates(
            currentLocation,
            endpoints
        );

        await this.proxy.setCurrentEndpoint(closestEndpoint);
        return closestEndpoint;
    };

    getVpnFailurePage = async () => {
        let vpnToken;
        try {
            vpnToken = await this.credentials.gainValidVpnToken();
        } catch (e) {
            log.error('Unable to get valid endpoints token. Error: ', e.message);
        }

        // undefined values will be omitted in the querystring
        const token = vpnToken.token || undefined;

        // if no endpoints info, then get endpoints failure url with empty token
        let appendToQueryString = false;
        if (!this.vpnInfo) {
            try {
                this.vpnInfo = await this.vpnProvider.getVpnExtensionInfo(token);
            } catch (e) {
                this.vpnInfo = { vpnFailurePage: POPUP_DEFAULT_SUPPORT_URL };
                appendToQueryString = true;
            }
        }

        const vpnFailurePage = this.vpnInfo && this.vpnInfo.vpnFailurePage;
        const appId = this.credentials.getAppId();

        const queryString = qs.stringify({ token, app_id: appId });

        const separator = appendToQueryString ? '&' : '?';

        return `${vpnFailurePage}${separator}${queryString}`;
    };
}

export default EndpointsService;
