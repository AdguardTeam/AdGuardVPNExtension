import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';
import { ExclusionsModes, ExclusionsTypes } from '../../../../common/exclusionsConstants';
import { ExclusionsList } from './ExclusionsList';
import { GroupsList } from './GroupsList';

import './children-list.pcss';

export const ChildrenList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const selectedExclusion = exclusionsStore.selectedExclusion;

    if (selectedExclusion.children?.length === 0) {
        return null;
    }

    // TODO handle subtitle for services and groups
    const subtitle = exclusionsStore.currentMode === ExclusionsModes.Regular
        ? reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_regular_mode')
        : reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_selecive_mode');

    const goBackHandler = () => {
        exclusionsStore.goBackHandler();
    }

    const renderChildrenList = () => {
        return selectedExclusion.type === ExclusionsTypes.Service
            ? <GroupsList />
            : <ExclusionsList />;
    }

    return (
        <>
            <div className="children-list__title">
                <button className="children-list__back-button back-button" type="button" onClick={goBackHandler}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#arrow" />
                    </svg>
                </button>
                <div>
                    <Title
                        title={selectedExclusion.value}
                        subtitle={subtitle as string}
                    />
                </div>
            </div>
            <div className="settings">
                {renderChildrenList()}
            </div>
        </>
    );
});
