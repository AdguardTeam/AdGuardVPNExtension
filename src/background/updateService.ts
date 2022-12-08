import { browserApi } from './browserApi';

const APP_VERSION_KEY = 'update.service.app.version';

interface UpdateServiceInterface {
    init(): Promise<void>;
    getAppVersionFromStorage(): Promise<string>;
    getAppVersionFromManifest(): Promise<string>;
    setAppVersionInStorage(appVersion: string): Promise<void>;
    setIsFirstRunFalse(): void;
}

class UpdateService implements UpdateServiceInterface {
    prevVersion: string;

    currentVersion: string;

    isFirstRun: boolean;

    isUpdate: boolean;

    init = async (): Promise<void> => {
        this.prevVersion = await this.getAppVersionFromStorage();
        this.currentVersion = await this.getAppVersionFromManifest();

        this.isFirstRun = (this.currentVersion !== this.prevVersion && !this.prevVersion);
        this.isUpdate = !!(this.currentVersion !== this.prevVersion && this.prevVersion);

        await this.setAppVersionInStorage(this.currentVersion);
    };

    getAppVersionFromStorage = async (): Promise<string> => {
        return browserApi.storage.get(APP_VERSION_KEY);
    };

    getAppVersionFromManifest = async (): Promise<string> => {
        return browserApi.runtime.getManifest().version;
    };

    setAppVersionInStorage = async (appVersion: string): Promise<void> => {
        return browserApi.storage.set(APP_VERSION_KEY, appVersion);
    };

    setIsFirstRunFalse = (): void => {
        this.isFirstRun = false;
    };
}

export const updateService = new UpdateService();
