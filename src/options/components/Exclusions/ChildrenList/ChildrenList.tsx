import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';
import { ExclusionsModes, ExclusionsTypes } from '../../../../common/exclusionsConstants';
import { ChildrenListItem } from './ChildrenListItem';
import { SubdomainModal } from './SubdomainModal';

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

    const resetServiceData = (id: string) => () => {
        exclusionsStore.resetServiceData(id);
    };

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const resetButtonClass = classnames(
        'button',
        'button--medium',
        'button--outline-gray',
        'children-list__reset',
        { hidden: selectedExclusion.type !== ExclusionsTypes.Service },
    );

    const addSubdomainButtonClass = classnames(
        'children-list__add-subdomain',
        'simple-button',
        { hidden: selectedExclusion.type !== ExclusionsTypes.Group },
    );

    const renderExclusions = () => {
        if (!exclusionsStore.sortedExclusions?.length) {
            exclusionsStore.setSelectedExclusionId(null);
            return;
        }
        return exclusionsStore.sortedExclusions.map((exclusion) => {
            if (exclusion) {
                return <ChildrenListItem exclusion={exclusion} key={exclusion.id} />
            }
        })
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
            <div>
                {renderExclusions()}
            </div>
            <button
                type="button"
                className={resetButtonClass}
                onClick={resetServiceData(selectedExclusion.id)}
            >
                {reactTranslator.getMessage('settings_exclusion_reset_to_default')}
            </button>
            <button
                type="button"
                className={addSubdomainButtonClass}
                onClick={onAddSubdomainClick}
            >
                {reactTranslator.getMessage('settings_exclusion_add_subdomain')}
            </button>
            <SubdomainModal />
        </>
    );
});
