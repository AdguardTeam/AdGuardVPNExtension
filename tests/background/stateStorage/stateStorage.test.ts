import browser from 'webextension-polyfill';

import { DEFAULT_STORAGE_DATA, StorageKey } from '../../../src/background/schema';
import { StateStorage } from '../../../src/background/stateStorage/stateStorage';
import { Prefs } from '../../../src/common/prefs';
import { log } from '../../../src/common/logger';

jest.mock('../../../src/common/logger');

const isFirefoxSpy = jest.spyOn(Prefs, 'isFirefox');
isFirefoxSpy.mockReturnValue(false);

const sessionStorageGetSpy = jest.spyOn(browser.storage.session, 'get');
sessionStorageGetSpy.mockResolvedValue(DEFAULT_STORAGE_DATA);

const sessionStorageSetMock = jest.spyOn(browser.storage.session, 'set');

describe('StateStorage', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should get default item from session storage if not existed before', async () => {
        const testKey = StorageKey.AuthState;

        sessionStorageGetSpy.mockResolvedValueOnce({});

        const stateStorage = new StateStorage();
        await stateStorage.init();

        // should read from session storage first
        expect(sessionStorageGetSpy).toHaveBeenCalled();

        // should save default values to session storage
        expect(sessionStorageSetMock).toHaveBeenCalled();

        // should be default value
        expect(stateStorage.getItem(testKey)).toEqual(DEFAULT_STORAGE_DATA[testKey]);
    });

    it('should get item from session storage if it existed before', async () => {
        const testKey = StorageKey.UpdateServiceState;
        const testStorage = {
            ...DEFAULT_STORAGE_DATA,
            [testKey]: {
                prevVersion: 'test prev version',
                currentVersion: 'test current version',
            },
        };

        sessionStorageGetSpy.mockResolvedValueOnce(testStorage);

        const stateStorage = new StateStorage();
        await stateStorage.init();

        // should read from session storage first
        expect(sessionStorageGetSpy).toHaveBeenCalled();

        // should not save default values to session storage
        expect(sessionStorageSetMock).not.toHaveBeenCalled();

        // should be existing value
        expect(stateStorage.getItem(testKey)).toEqual(testStorage[testKey]);
    });

    it('should set item to session storage properly', async () => {
        const testKey = StorageKey.AuthState;
        const testValue = 'testValue';

        const stateStorage = new StateStorage();
        await stateStorage.init();

        stateStorage.setItem(testKey, testValue);

        // should be saved to session storage
        expect(sessionStorageSetMock).toHaveBeenCalledWith({ [testKey]: testValue });
    });

    it('should set item to session storage if part of object is not serializable in Firefox', async () => {
        const testKey = StorageKey.AuthState;
        const testValue: any = {
            test: 'testValue',
            nonSerializable: () => {
                throw new Error('non-serializable');
            },
        };
        const serializedTestValue: any = {
            test: 'testValue',
        };

        isFirefoxSpy.mockReturnValueOnce(true);

        const stateStorage = new StateStorage();
        await stateStorage.init();

        stateStorage.setItem(testKey, testValue);

        // should be saved to session storage
        expect(sessionStorageSetMock).toHaveBeenCalledWith({ [testKey]: serializedTestValue });
    });

    it('should not set item to session storage if circular referenced object passed in Firefox', async () => {
        const testKey = StorageKey.AuthState;
        const testValue: any = {
            test: 'testValue',
            circularReference: null,
        };
        testValue.circularReference = testValue;

        isFirefoxSpy.mockReturnValueOnce(true);

        const stateStorage = new StateStorage();
        await stateStorage.init();

        stateStorage.setItem(testKey, testValue);

        // should log an error
        expect(log.error).toHaveBeenCalled();

        // should not be saved to session storage
        expect(sessionStorageSetMock).not.toHaveBeenCalled();
    });

    it('should throw an error if not initialized', () => {
        const testKey = StorageKey.AuthState;
        const errorMessage = 'StateStorage is not initialized. Call init() method first.';

        const stateStorage = new StateStorage();
        expect(() => stateStorage.setItem(testKey, 'testValue')).toThrowError(errorMessage);
        expect(() => stateStorage.getItem(testKey)).toThrowError(errorMessage);
    });
});
