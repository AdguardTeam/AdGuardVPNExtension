import userLocation from '../../../src/background/endpoints/userLocation';

jest.mock('../../../src/background/browserApi');

describe('UserLocation class', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getCurrentLocation returns object with current location coordinates', async () => {
        const currentLocation = await userLocation.getCurrentLocation();
        expect(currentLocation.coordinates).toBeDefined();
        expect(currentLocation.coordinates).toHaveLength(2);
    });
});
