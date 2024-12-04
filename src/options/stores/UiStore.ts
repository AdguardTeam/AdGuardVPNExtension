import { action, computed, observable } from 'mobx';

import { type RootStore } from './RootStore';

/**
 * This store contains state for UI only.
 */
export class UiStore {
    @observable isSidebarOpen = false;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action openSidebar = (): void => {
        this.isSidebarOpen = true;
    };

    @action closeSidebar = (): void => {
        this.isSidebarOpen = false;
    };

    /**
     * This computed state indicates when content is overlapped with modal, sidebar, etc.
     * It's used as scroll blocker if any modal, sidebar is open. And also in order to
     * trap focus inside of that opened element.
     *
     * TODO: Bring modal states to this computed state (AG-38059).
     */
    @computed get isContentLocked(): boolean {
        return this.isSidebarOpen;
    }
}
