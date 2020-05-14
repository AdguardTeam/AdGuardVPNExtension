import getCurrentLocation from '../../../src/background/endpoints/userLocation';

jest.mock('../../../src/background/browserApi');

describe('userLocation module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getCurrentLocation returns object with current location coordinates', async () => {
        const currentLocation = await getCurrentLocation();
        expect(currentLocation.coordinates).toBeDefined();
        expect(currentLocation.coordinates).toHaveLength(2);
    });
});
