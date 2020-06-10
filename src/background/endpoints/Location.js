import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';
import notifier from '../../lib/notifier';

export class Location {
    PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    constructor(locationData) {
        this.id = locationData.id;
        this.countryName = locationData.countryName;
        this.cityName = locationData.cityName;
        this.countryCode = locationData.countryCode;
        this.endpoints = locationData.endpoints;
        this.pingData = {
            isMeasuring: false,
            lastMeasurementTime: 0,
            ping: null,
        };
        this.available = true;
    }

    // TODO get working endpoint
    // getEndpoint = async () => {
    //     let ping;
    //     if (!this.endpoints) {
    //         return null;
    //     }
    //     while (!ping || ) {
    //         ping =
    //     }
    // };

    measurePings = async () => {
        if (this.pingData.isMeasuring) {
            return;
        }

        const isFresh = !(Date.now() - this.pingData.lastMeasurementTime >= this.PING_TTL_MS);
        const hasPing = !!this.pingData.ping;

        if (isFresh && hasPing) {
            return;
        }

        this.pingData.isMeasuring = true;

        let ping = null;
        let i = 0;
        while (!ping && this.endpoints[i]) {
            const endpoint = this.endpoints[i];
            // eslint-disable-next-line no-await-in-loop
            ping = await measurePingToEndpointViaFetch(endpoint.domainName) || null;
            i += 1;
        }

        if (!ping) {
            this.available = false;
            this.pingData.ping = ping;
        } else {
            this.available = true;
            this.pingData.ping = ping;
        }

        this.pingData.isMeasuring = false;
        this.pingData.lastMeasurementTime = Date.now();

        notifier.notifyListeners(
            notifier.types.LOCATION_STATE_UPDATED,
            {
                locationId: this.id,
                ping,
                available: this.available,
            }
        );
    }

    getPingData = () => {
        return this.pingData;
    }

    setPingData = (pingData) => {
        this.pingData = pingData;
    }

    get ping() {
        return this.pingData.ping;
    }
}
