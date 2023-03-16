import { browserApi } from './browserApi';
import { session } from './sessionStorage';

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
        let { prevVersion } = session.currentState.updateServiceState;
        if (!prevVersion) {
            prevVersion = await this.getAppVersionFromStorage();
            await session.updatePrevVersion(prevVersion);
        }

        let { currentVersion } = session.currentState.updateServiceState;
        if (!currentVersion) {
            currentVersion = await this.getAppVersionFromManifest();
            await session.updateCurrentVersion(currentVersion);
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
        await session.updatePrevVersion(appVersion);
        return browserApi.storage.set(APP_VERSION_KEY, appVersion);
    };

    setIsFirstRunFalse = (): void => {
        this.isFirstRun = false;
    };
}

export const updateService = new UpdateService();
