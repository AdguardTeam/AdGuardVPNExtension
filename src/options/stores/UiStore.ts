import { action, computed, observable } from 'mobx';

import { type RootStore } from './RootStore';

/**
 * This store contains state for UI only.
 */
export class UiStore {
    @observable public isSidebarOpen = false;

    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action public openSidebar = (): void => {
        this.isSidebarOpen = true;
    };

    @action public closeSidebar = (): void => {
        this.isSidebarOpen = false;
    };

    @computed public get isAnyModalOpen(): boolean {
        return (
            this.rootStore.settingsStore.isCustomDnsModalOpen
            || this.rootStore.settingsStore.isHelpUsImproveModalOpen
            || this.rootStore.exclusionsStore.modeSelectorModalOpen
            || this.rootStore.exclusionsStore.removeAllModalOpen
            || this.rootStore.exclusionsStore.selectListModalOpen
            || this.rootStore.exclusionsStore.addExclusionModalOpen
            || this.rootStore.exclusionsStore.confirmAddModalOpen
            || this.rootStore.exclusionsStore.resetServiceModalOpen
            || this.rootStore.exclusionsStore.addSubdomainModalOpen
        );
    }

    /**
     * This computed state indicates when content is overlapped with modal, sidebar, etc.
     * It's used as scroll blocker if any modal, sidebar is open. And also in order to
     * trap focus inside of that opened element.
     */
    @computed public get isContentLocked(): boolean {
        return this.isSidebarOpen || this.isAnyModalOpen;
    }
}
