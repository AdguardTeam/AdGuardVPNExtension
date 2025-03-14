import { SavedLocations, LocationsTab } from '../../../src/background/savedLocations/SavedLocations';

const mockStorage = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
};

describe('SavedLocations', () => {
    let savedLocations: SavedLocations;

    beforeEach(() => {
        savedLocations = new SavedLocations({
            storage: mockStorage,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('SavedLocations.locationsTab', () => {
        it('should read from storage and save when not exists', async () => {
            mockStorage.get.mockResolvedValue(undefined);

            await savedLocations.getLocationsTab();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
        });

        it('should cache value read from storage', async () => {
            mockStorage.get.mockResolvedValue(LocationsTab.All);

            // Try to read twice, to see if it caches value in-memory
            await savedLocations.getLocationsTab();
            await savedLocations.getLocationsTab();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should validate value when reading from storage', async () => {
            mockStorage.get.mockResolvedValue('invalid');

            await savedLocations.getLocationsTab();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), LocationsTab.All);
        });

        it('should save to storage', async () => {
            await savedLocations.saveLocationsTab(LocationsTab.All);

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), LocationsTab.All);
        });
    });

    describe('SavedLocations.savedLocationIds', () => {
        it('should read from storage and save when not exists', async () => {
            mockStorage.get.mockResolvedValue(undefined);

            await savedLocations.getSavedLocationIds();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
        });

        it('should cache value read from storage', async () => {
            mockStorage.get.mockResolvedValue([]);

            // Try to read twice, to see if it caches value in-memory
            await savedLocations.getSavedLocationIds();
            await savedLocations.getSavedLocationIds();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should validate value when reading from storage', async () => {
            mockStorage.get.mockResolvedValue('invalid');

            await savedLocations.getSavedLocationIds();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), expect.any(Array));
        });

        it('should add location to saved locations', async () => {
            mockStorage.get.mockResolvedValue([]);

            await savedLocations.addSavedLocation('locationId');

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), ['locationId']);
        });

        it('should not add location if it already exists', async () => {
            mockStorage.get.mockResolvedValue(['locationId']);

            await savedLocations.addSavedLocation('locationId');

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should remove location from saved locations', async () => {
            mockStorage.get.mockResolvedValue(['locationId']);

            await savedLocations.removeSavedLocation('locationId');

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), []);
        });

        it('should not remove location if it not exist', async () => {
            mockStorage.get.mockResolvedValue([]);

            await savedLocations.removeSavedLocation('locationId');

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).not.toHaveBeenCalled();
        });
    });
});
