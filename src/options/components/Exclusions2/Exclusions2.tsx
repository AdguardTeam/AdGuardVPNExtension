import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { ModeSelector } from './ModeSelector';
import { Search } from './Search';
import { Actions } from './Actions';
import { List } from './List';
import { AddExclusionModal } from './ExclusionsModal/AddExclusionsModal/AddExclusionModal';
import { ExclusionSettings } from './ExclusionSettings';

import './exclusions.pcss';
import '../ui/radio.pcss';

export const Exclusions2 = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { exclusionIdToShowSettings } = exclusionsStore;

    if (exclusionIdToShowSettings) {
        return (
            <ExclusionSettings />
        );
    }

    return (
        <>
            <Title
                title={reactTranslator.getMessage('settings_exclusion_title')}
                subtitle="Please select the VPN mode"
            />
            <div className="settings">
                <ModeSelector />
                <Search placeholder="Search website" />
                <Actions />
                <List />
                <AddExclusionModal />
            </div>
        </>
    );
});
