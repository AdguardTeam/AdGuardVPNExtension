import { browserApi } from './browserApi';
import { sessionState } from './sessionStorage';
import { StorageKey } from './schema';

const APP_VERSION_KEY = 'update.service.app.version';

interface UpdateServiceInterface {
    init(): Promise<void>;
    getAppVersionFromStorage(): Promise<string>;
    getAppVersionFromManifest(): Promise<string>;
    setAppVersionInStorage(appVersion: string): Promise<void>;
    setIsFirstRunFalse(): void;
}

class UpdateService implements UpdateServiceInterface {
    isFirstRun: boolean;

    isUpdate: boolean;

    get prevVersion() {
        return sessionState.getItem(StorageKey.UpdateServiceState).prevVersion;
    }

    set prevVersion(prevVersion: string) {
        const updateServiceState = sessionState.getItem(StorageKey.UpdateServiceState);
        updateServiceState.prevVersion = prevVersion;
        sessionState.setItem(StorageKey.ProxyState, updateServiceState);
    }

    get currentVersion() {
        return sessionState.getItem(StorageKey.UpdateServiceState).currentVersion;
    }

    set currentVersion(currentVersion: string) {
        const updateServiceState = sessionState.getItem(StorageKey.UpdateServiceState);
        updateServiceState.currentVersion = currentVersion;
        sessionState.setItem(StorageKey.ProxyState, updateServiceState);
    }

    init = async (): Promise<void> => {
        if (!this.prevVersion) {
            this.prevVersion = await this.getAppVersionFromStorage();
        }

        if (!this.currentVersion) {
            this.currentVersion = await this.getAppVersionFromManifest();
            await this.setAppVersionInStorage(this.currentVersion);
        }

        this.isFirstRun = (this.currentVersion !== this.prevVersion && !this.prevVersion);
        this.isUpdate = !!(this.currentVersion !== this.prevVersion && this.prevVersion);
    };

    getAppVersionFromStorage = async (): Promise<string> => {
        return browserApi.storage.get(APP_VERSION_KEY);
    };

    getAppVersionFromManifest = async (): Promise<string> => {
        return browserApi.runtime.getManifest().version;
    };

    setAppVersionInStorage = async (appVersion: string): Promise<void> => {
        this.prevVersion = appVersion;
        return browserApi.storage.set(APP_VERSION_KEY, appVersion);
    };

    setIsFirstRunFalse = (): void => {
        this.isFirstRun = false;
    };
}

export const updateService = new UpdateService();
