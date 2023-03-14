import { browserApi } from './browserApi';
import { extensionState } from './extensionState';

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

    init = async (): Promise<void> => {
        let { prevVersion } = extensionState.currentState.updateServiceState;
        if (!prevVersion) {
            prevVersion = await this.getAppVersionFromStorage();
            await extensionState.updatePrevVersion(prevVersion);
        }

        let { currentVersion } = extensionState.currentState.updateServiceState;
        if (!currentVersion) {
            currentVersion = await this.getAppVersionFromManifest();
            await extensionState.updateCurrentVersion(currentVersion);
            await this.setAppVersionInStorage(currentVersion);
        }

        this.isFirstRun = (currentVersion !== prevVersion && !prevVersion);
        this.isUpdate = !!(currentVersion !== prevVersion && prevVersion);
    };

    getAppVersionFromStorage = async (): Promise<string> => {
        return browserApi.storage.get(APP_VERSION_KEY);
    };

    getAppVersionFromManifest = async (): Promise<string> => {
        return browserApi.runtime.getManifest().version;
    };

    setAppVersionInStorage = async (appVersion: string): Promise<void> => {
        await extensionState.updatePrevVersion(appVersion);
        return browserApi.storage.set(APP_VERSION_KEY, appVersion);
    };

    setIsFirstRunFalse = (): void => {
        this.isFirstRun = false;
    };
}

export const updateService = new UpdateService();
