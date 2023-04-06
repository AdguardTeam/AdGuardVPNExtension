import { DEFAULT_STORAGE_DATA, StorageData, StorageKey } from '../../schema';
import { StateStorageInterface } from '../stateStorage.abstract';

export class StateStorage implements StateStorageInterface {
    private state: StorageData;

    public getItem(key: StorageKey): any {
        return this.state[key];
    }

    public setItem(key: StorageKey, value: any): void {
        this.state[key] = value;
    }

    public init(): Promise<void> {
        this.state = { ...DEFAULT_STORAGE_DATA };
        return Promise.resolve();
    }
}

export const sessionState = new StateStorage();
