import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { ModeSelector } from './ModeSelector';
import { Actions } from './Actions';
import { List } from './List';
import { AddExclusionModal } from './ExclusionsModal/AddExclusionsModal';
import { ExclusionSettings } from './ExclusionSettings';
import { ExclusionsSearch } from './Search/ExclusionsSearch';
import { translator } from '../../../common/translator';

import './exclusions.pcss';
import '../ui/radio.pcss';

export const Exclusions = observer(() => {
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
                title={translator.getMessage('settings_exclusion_title')}
                subtitle={translator.getMessage('settings_exclusion_select_mode')}
            />
            <div className="settings">
                <ModeSelector />
                <ExclusionsSearch />
                <Actions />
                <List />
                <AddExclusionModal />
            </div>
        </>
    );
});
