import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { SavedLocations } from '../../../src/background/savedLocations/SavedLocations';

const mockStorage = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
};

describe('SavedLocations', () => {
    let savedLocations: SavedLocations;

    beforeEach(() => {
        savedLocations = new SavedLocations({
            storage: mockStorage,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('SavedLocations.savedLocationIds', () => {
        it('should read from storage and save when not exists', async () => {
            mockStorage.get.mockResolvedValue(undefined);

            const result = await savedLocations.getSavedLocationIds();

            // Should read from storage
            expect(mockStorage.get).toHaveBeenCalledTimes(1);

            // Should be default value
            expect(result).toEqual([]);

            // Should save to storage default value
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), []);
        });

        it('should cache value read from storage', async () => {
            mockStorage.get.mockResolvedValue(['locationId']);

            // Try to read twice, to see if it caches value in-memory
            const result1 = await savedLocations.getSavedLocationIds();
            const result2 = await savedLocations.getSavedLocationIds();

            // Should read from storage only once
            expect(mockStorage.get).toHaveBeenCalledTimes(1);

            // Should be value from storage
            expect(result1).toEqual(['locationId']);
            expect(result2).toEqual(['locationId']);

            // Should not save to storage because it was already there
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should validate value when reading from storage', async () => {
            mockStorage.get.mockResolvedValue('invalid');

            const result = await savedLocations.getSavedLocationIds();

            // Should read from storage
            expect(mockStorage.get).toHaveBeenCalledTimes(1);

            // Should be default value
            expect(result).toEqual([]);

            // Should save to storage default value
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), []);
        });

        it('should add location to saved locations', async () => {
            mockStorage.get.mockResolvedValue(['testLocationId']);

            await savedLocations.addSavedLocation('locationId');

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), ['testLocationId', 'locationId']);
        });

        it('should not add location if it already exists', async () => {
            mockStorage.get.mockResolvedValue(['locationId']);

            await savedLocations.addSavedLocation('locationId');

            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should remove location from saved locations', async () => {
            mockStorage.get.mockResolvedValue(['locationId']);

            await savedLocations.removeSavedLocation('locationId');

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), []);
        });

        it('should not remove location if it not exist', async () => {
            mockStorage.get.mockResolvedValue(['testLocationId']);

            await savedLocations.removeSavedLocation('locationId');

            expect(mockStorage.set).not.toHaveBeenCalled();
        });
    });
});
