import {
    vi,
    describe,
    afterEach,
    it,
    expect,
} from 'vitest';
import browser from 'webextension-polyfill';

import {
    DEFAULT_STORAGE_DATA,
    PROFILE_SESSION_STATE_DEFAULTS,
    StorageKey,
    type StorageData,
} from '../../../src/background/schema';
import { StateStorage } from '../../../src/background/stateStorage/stateStorage';
import { log } from '../../../src/common/logger';

const sessionStorageGetSpy = vi.spyOn(browser.storage.session, 'get');
sessionStorageGetSpy.mockResolvedValue(DEFAULT_STORAGE_DATA);

const sessionStorageSetMock = vi.spyOn(browser.storage.session, 'set');

describe('StateStorage', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should get default item from session storage if not existed before', async () => {
        const testKey = StorageKey.AuthState;

        sessionStorageGetSpy.mockResolvedValueOnce({});

        const stateStorage = new StateStorage();

        const testData = await stateStorage.getItem(testKey);

        // should read from session storage first
        expect(sessionStorageGetSpy).toHaveBeenCalled();

        // should save default values to session storage
        expect(sessionStorageSetMock).toHaveBeenCalled();

        // should be default value
        expect(testData).toEqual(DEFAULT_STORAGE_DATA[testKey]);
    });

    it('should keep existing keys when profileSessionState is missing', async () => {
        const raw: Partial<StorageData> = { ...DEFAULT_STORAGE_DATA };
        delete raw[StorageKey.ProfileSessionState];
        raw[StorageKey.UpdateServiceState] = { prevVersion: '1.2.3' };

        sessionStorageGetSpy.mockResolvedValueOnce(raw);

        const stateStorage = new StateStorage();

        const updateState = await stateStorage.getItem(StorageKey.UpdateServiceState);
        const profileSession = await stateStorage.getItem(StorageKey.ProfileSessionState);

        // Other keys must survive — a required-key validation failure would
        // reset the whole state to defaults.
        expect(updateState).toEqual({ prevVersion: '1.2.3' });
        expect(profileSession).toEqual(PROFILE_SESSION_STATE_DEFAULTS);
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

        const testData = await stateStorage.getItem(testKey);

        // should read from session storage first
        expect(sessionStorageGetSpy).toHaveBeenCalled();

        // should not save default values to session storage
        expect(sessionStorageSetMock).not.toHaveBeenCalled();

        // should be existing value
        expect(testData).toEqual(testStorage[testKey]);
    });

    it('should load legacy services manager state without a locale marker', async () => {
        const testKey = StorageKey.ExclusionsServicesManagerState;
        const legacyServicesState = {
            lastUpdateTimeMs: null,
            services: null,
            servicesIndex: {},
        };
        const testStorage = {
            ...DEFAULT_STORAGE_DATA,
            [testKey]: legacyServicesState,
        };

        sessionStorageGetSpy.mockResolvedValueOnce(testStorage);

        const stateStorage = new StateStorage();
        const testData = await stateStorage.getItem(testKey);

        expect(sessionStorageSetMock).not.toHaveBeenCalled();
        expect(testData).toEqual({
            ...legacyServicesState,
            lastUpdateLocale: null,
        });
    });

    it('should set item to session storage properly', async () => {
        const testKey = StorageKey.AuthState;
        const testValue = {
            accessTokenData: {
                accessToken: 'test access token',
                expiresIn: 123456,
                tokenType: 'bearer' as const,
                scope: 'trust' as const,
            },
        };

        const stateStorage = new StateStorage();

        // `any` just to suppress TS error for non-matching type
        await stateStorage.setItem(testKey, testValue);

        // should be saved to session storage
        expect(sessionStorageSetMock).toHaveBeenCalledWith({
            ...DEFAULT_STORAGE_DATA,
            [testKey]: testValue,
        });
    });

    it('should set item to session storage if part of object is not serializable', async () => {
        const testKey = StorageKey.AuthState;
        const serializedTestValue = {
            accessTokenData: {
                accessToken: 'test access token',
                expiresIn: 123456,
                tokenType: 'bearer' as const,
                scope: 'trust' as const,
            },
        };
        const testValue: any = {
            ...serializedTestValue,
            nonSerializableFn: () => {
                throw new Error('non-serializable');
            },
            nonSerializableSymbol: Symbol('non-serializable'),
            nonSerializableUndefined: undefined,
        };

        const stateStorage = new StateStorage();

        await stateStorage.setItem(testKey, testValue);

        // should be saved to session storage
        expect(sessionStorageSetMock).toHaveBeenCalledWith({
            ...DEFAULT_STORAGE_DATA,
            [testKey]: serializedTestValue,
        });
    });

    it('should not set item to session storage if circular referenced object passed', async () => {
        const testKey = StorageKey.AuthState;
        const testValue: any = {
            test: 'testValue',
            circularReference: null,
        };
        testValue.circularReference = testValue;

        const stateStorage = new StateStorage();

        await stateStorage.setItem(testKey, testValue);

        // should log an error
        expect(log.error).toHaveBeenCalled();

        // should not be saved to session storage
        expect(sessionStorageSetMock).not.toHaveBeenCalled();
    });

    it('should properly set item partially', async () => {
        const testKey = StorageKey.FallbackInfo;

        sessionStorageGetSpy.mockResolvedValueOnce({
            ...DEFAULT_STORAGE_DATA,
            [testKey]: {
                vpnApiUrl: '',
                authApiUrl: '',
                forwarderApiUrl: '',
                expiresInMs: 60000,
            },
        });

        const stateStorage = new StateStorage();

        await stateStorage.updateItem(testKey, {
            authApiUrl: 'test value',
        });

        // should read from session storage first
        expect(sessionStorageGetSpy).toHaveBeenCalled();

        // should be saved to session storage
        expect(sessionStorageSetMock).toHaveBeenCalledWith({
            ...DEFAULT_STORAGE_DATA,
            [testKey]: {
                vpnApiUrl: '',
                authApiUrl: 'test value',
                forwarderApiUrl: '',
                expiresInMs: 60000,
            },
        });

        const testData = await stateStorage.getItem(testKey);

        // should be updated value
        expect(testData).toEqual({
            vpnApiUrl: '',
            authApiUrl: 'test value',
            forwarderApiUrl: '',
            expiresInMs: 60000,
        });
    });
});
