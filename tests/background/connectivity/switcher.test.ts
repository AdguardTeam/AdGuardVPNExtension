import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';

const mockGetSelectedLocation = vi.hoisted(() => vi.fn());
const mockShouldResolveFastestLocation = vi.hoisted(() => vi.fn());
const mockSelectFastestLocation = vi.hoisted(() => vi.fn());
const mockConsumeDisplayedLocation = vi.hoisted(() => vi.fn());
const mockClearDisplayedLocation = vi.hoisted(() => vi.fn());
const mockGetEndpointByLocation = vi.hoisted(() => vi.fn());
const mockConnectivitySend = vi.hoisted(() => vi.fn());

vi.mock('../../../src/background/credentials', () => ({
    credentials: {
        trackInstallation: vi.fn().mockResolvedValue(undefined),
        getAccessCredentials: vi.fn().mockResolvedValue({
            credentials: { password: 'password', username: 'username' },
            token: 'token',
            credentialsHash: 'hash',
        }),
    },
}));

vi.mock('../../../src/background/proxy', () => ({
    proxy: {
        setCurrentEndpoint: vi.fn().mockResolvedValue({ domainName: 'de.endpoint.test' }),
        setAccessCredentials: vi.fn().mockResolvedValue({ domainName: 'de.endpoint.test' }),
    },
}));

vi.mock('../../../src/background/endpoints/locationsService', () => ({
    locationsService: {
        getSelectedLocation: mockGetSelectedLocation,
        shouldResolveFastestLocation: mockShouldResolveFastestLocation,
        selectFastestLocation: mockSelectFastestLocation,
        consumeDisplayedLocation: mockConsumeDisplayedLocation,
        clearDisplayedLocation: mockClearDisplayedLocation,
        getEndpointByLocation: mockGetEndpointByLocation,
    },
}));

vi.mock('../../../src/background/connectivity/index', () => ({
    connectivity: {
        endpointConnectivity: {
            setCredentials: vi.fn(),
            start: vi.fn(),
            stop: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

vi.mock('../../../src/background/connectivity/connectivityService', () => ({
    connectivityService: { send: mockConnectivitySend },
    ConnectivityEventType: { ConnectionFail: 'connectionFail' },
    MIN_CONNECTION_DURATION_MS: 0,
}));

// eslint-disable-next-line import/first
import { switcher } from '../../../src/background/connectivity/switcher';

const FASTEST_LOCATION = {
    id: 'loc-fast',
    cityName: 'Fast',
    countryName: 'Germany',
    countryCode: 'DE',
};

const SELECTED_LOCATION = {
    id: 'loc-berlin',
    cityName: 'Berlin',
    countryName: 'Germany',
    countryCode: 'DE',
};

const ENDPOINT = {
    id: 'de.endpoint.test',
    domainName: 'de.endpoint.test',
};

describe('switcher connect flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetEndpointByLocation.mockResolvedValue(ENDPOINT);
        mockShouldResolveFastestLocation.mockResolvedValue(false);
        mockConsumeDisplayedLocation.mockReturnValue(false);
    });

    it('should connect to the selected location when one is already selected', async () => {
        mockGetSelectedLocation.mockResolvedValue(SELECTED_LOCATION);

        await switcher.turnOn();

        expect(mockSelectFastestLocation).not.toHaveBeenCalled();
        expect(mockGetEndpointByLocation).toHaveBeenCalledWith(SELECTED_LOCATION, false);
    });

    it('should resolve the fastest location on connect when the session has no location', async () => {
        mockGetSelectedLocation.mockResolvedValue(null);
        mockSelectFastestLocation.mockResolvedValue(FASTEST_LOCATION);

        await switcher.turnOn();

        expect(mockSelectFastestLocation).toHaveBeenCalledTimes(1);
        expect(mockGetEndpointByLocation).toHaveBeenCalledWith(FASTEST_LOCATION, false);
    });

    it('should resolve the fastest location on connect when the location is not picked by the user', async () => {
        mockGetSelectedLocation.mockResolvedValue(SELECTED_LOCATION);
        mockShouldResolveFastestLocation.mockResolvedValue(true);
        mockSelectFastestLocation.mockResolvedValue(FASTEST_LOCATION);

        await switcher.turnOn();

        expect(mockSelectFastestLocation).toHaveBeenCalledTimes(1);
        expect(mockGetEndpointByLocation).toHaveBeenCalledWith(FASTEST_LOCATION, false);
    });

    it('should keep the selected location when the fastest location cannot be resolved', async () => {
        mockGetSelectedLocation.mockResolvedValue(SELECTED_LOCATION);
        mockShouldResolveFastestLocation.mockResolvedValue(true);
        mockSelectFastestLocation.mockResolvedValue(null);

        await switcher.turnOn();

        expect(mockGetEndpointByLocation).toHaveBeenCalledWith(SELECTED_LOCATION, false);
        expect(mockConnectivitySend).not.toHaveBeenCalledWith('connectionFail');
    });

    it('should use the location displayed in the popup without resolving the fastest one', async () => {
        mockGetSelectedLocation.mockResolvedValue(SELECTED_LOCATION);
        mockConsumeDisplayedLocation.mockReturnValue(true);
        mockShouldResolveFastestLocation.mockResolvedValue(true);

        await switcher.turnOn();

        expect(mockShouldResolveFastestLocation).not.toHaveBeenCalled();
        expect(mockSelectFastestLocation).not.toHaveBeenCalled();
        expect(mockGetEndpointByLocation).toHaveBeenCalledWith(SELECTED_LOCATION, false);
    });

    it('should fail the connect when the fastest location cannot be resolved', async () => {
        mockGetSelectedLocation.mockResolvedValue(null);
        mockSelectFastestLocation.mockResolvedValue(null);

        await switcher.turnOn();

        expect(mockConnectivitySend).toHaveBeenCalledWith('connectionFail');
        expect(mockGetEndpointByLocation).not.toHaveBeenCalled();
    });

    it('should clear the displayed location on an explicit disconnect', async () => {
        await switcher.turnOff();

        expect(mockClearDisplayedLocation).toHaveBeenCalledTimes(1);
    });

    it('should keep the displayed location on a retry', async () => {
        mockGetSelectedLocation.mockResolvedValue(SELECTED_LOCATION);

        await switcher.retryTurnOn();

        expect(mockClearDisplayedLocation).not.toHaveBeenCalled();
    });
});
