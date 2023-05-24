import { browserApi } from './browserApi';
import { sessionState } from './sessionStorage';
import { StorageKey, UpdateServiceState } from './schema';

const APP_VERSION_KEY = 'update.service.app.version';

interface UpdateServiceInterface {
    init(): Promise<void>;
    getAppVersionFromStorage(): Promise<string | undefined>;
    getAppVersionFromManifest(): Promise<string>;
    setAppVersionInStorage(appVersion: string): Promise<void>;
    setIsFirstRunFalse(): void;
}

class UpdateService implements UpdateServiceInterface {
    state: UpdateServiceState;

    isFirstRun: boolean;

    isUpdate: boolean;

    private get prevVersion() {
        return this.state.prevVersion;
    }

    private set prevVersion(prevVersion: string | undefined) {
        this.state.prevVersion = prevVersion;
        sessionState.setItem(StorageKey.UpdateServiceState, this.state);
    }

    private get currentVersion() {
        return this.state.currentVersion;
    }

    private set currentVersion(currentVersion: string | undefined) {
        this.state.currentVersion = currentVersion;
        sessionState.setItem(StorageKey.UpdateServiceState, this.state);
    }

    init = async (): Promise<void> => {
        this.state = sessionState.getItem(StorageKey.UpdateServiceState);

        if (!this.prevVersion) {
            this.prevVersion = await this.getAppVersionFromStorage();
        }

        if (!this.currentVersion) {
            this.currentVersion = await this.getAppVersionFromManifest();
        }

        this.isFirstRun = (this.currentVersion !== this.prevVersion && !this.prevVersion);
        this.isUpdate = !!(this.currentVersion !== this.prevVersion && this.prevVersion);

        await this.setAppVersionInStorage(this.currentVersion);
    };

    getAppVersionFromStorage = async (): Promise<string | undefined> => {
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
