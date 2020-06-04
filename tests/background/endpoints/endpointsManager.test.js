import { EndpointsManager } from '../../../src/background/endpoints/endpointsManager';
import { measurePingToEndpointViaFetch } from '../../../src/background/connectivity/pingHelpers';
import { sleep } from '../../../src/lib/helpers';

jest.mock('../../../src/background/connectivity/pingHelpers', () => ({
    measurePingToEndpointViaFetch: jest.fn(),
}));

const inputEndpoints = {
    'do-ca-tor1-01-jbnyx56n.adguard.io': {
        id: 'do-ca-tor1-01-jbnyx56n.adguard.io',
        cityName: 'Toronto',
        countryCode: 'CA',
        countryName: 'Canada',
        domainName: 'do-ca-tor1-01-jbnyx56n.adguard.io',
        coordinates: [-79.34, 43.65],
        premiumOnly: false,
        publicKey: 'l+4CZN7RIFsnU/UgIse3BHJC1fzUHbNJh51lIfPOQQ8=',
    },
    'do-de-fra1-01.adguard.io': {
        id: 'do-de-fra1-01.adguard.io',
        cityName: 'Frankfurt',
        countryCode: 'DE',
        countryName: 'Germany',
        domainName: 'do-de-fra1-01.adguard.io',
        coordinates: [8.68, 50.11],
        premiumOnly: false,
        publicKey: 'UXKhYwlbiRKYa115QjsOdET6ibB4rEnbQDSECoHTXBM=',
    },
    'do-gb-lon1-01-hk7z7xez.adguard.io': {
        id: 'do-gb-lon1-01-hk7z7xez.adguard.io',
        cityName: 'London',
        countryCode: 'GB',
        countryName: 'United Kingdom',
        domainName: 'do-gb-lon1-01-hk7z7xez.adguard.io',
        coordinates: [-0.11, 51.5],
        premiumOnly: false,
        publicKey: 'uj63wPR3XdE2k7xmtNNoRpWwEF56UBxKtIfKelQu9BM=',
    },
};

let endpointsManager;
beforeEach(() => {
    endpointsManager = new EndpointsManager();
    measurePingToEndpointViaFetch.mockClear();
});

describe('endpointsManager', () => {
    it('saves endpoints', () => {
        endpointsManager.setEndpoints(inputEndpoints);
        const endpoints = endpointsManager.getEndpoints();
        expect(Object.values(endpoints).length).toBe(Object.values(inputEndpoints).length);
    });

    it('start determining pings when endpoints where added', async () => {
        const expectedPingValue = 10;
        measurePingToEndpointViaFetch.mockReturnValue(expectedPingValue);
        endpointsManager.setEndpoints(inputEndpoints);
        const inputEndpointsLength = Object.values(inputEndpoints).length;
        let endpoints = endpointsManager.getEndpoints();
        // pings are undefined yet
        expect(Object.values(endpoints).map((endpoint) => endpoint.ping))
            .toEqual(new Array(inputEndpointsLength).fill(null));

        // after pings determination ends
        await sleep(10);
        endpoints = endpointsManager.getEndpoints();
        expect(Object.values(endpoints).length).toBe(inputEndpointsLength);
        expect(Object.values(endpoints).map((endpoint) => endpoint.ping))
            .toEqual(new Array(inputEndpointsLength).fill(expectedPingValue));
    });

    it('determines pings once in 10 minutes no matter how much measure pings was called', async () => {
        const expectedPingValue = 10;
        measurePingToEndpointViaFetch.mockReturnValue(expectedPingValue);

        endpointsManager.setEndpoints(inputEndpoints);
        const inputEndpointsLength = Object.values(inputEndpoints).length;
        let endpoints = endpointsManager.getEndpoints();

        // pings are null
        expect(Object.values(endpoints).map((endpoint) => endpoint.ping))
            .toEqual(new Array(inputEndpointsLength).fill(null));

        // after pings determination ends pings are defined
        await sleep(10);
        endpoints = endpointsManager.getEndpoints();
        expect(measurePingToEndpointViaFetch).toBeCalledTimes(3);
        expect(Object.values(endpoints).length).toBe(inputEndpointsLength);
        expect(Object.values(endpoints).map((endpoint) => endpoint.ping))
            .toEqual(new Array(inputEndpointsLength).fill(expectedPingValue));

        // if get endpoints was called again we do not calculate pings
        await sleep(10);
        endpointsManager.getEndpoints();
        expect(measurePingToEndpointViaFetch).toBeCalledTimes(3);
    });
});
