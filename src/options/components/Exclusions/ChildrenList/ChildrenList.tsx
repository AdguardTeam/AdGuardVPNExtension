import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { reactTranslator } from '../../../../common/reactTranslator';
import { ExclusionsMode, ExclusionsType } from '../../../../common/exclusionsConstants';
import { isTopLevel } from '../../../../common/url-utils';

import { ChildrenListItem } from './ChildrenListItem';
import { SubdomainModal } from './SubdomainModal';
import { ResetServiceModal } from './ResetServiceModal';

import './children-list.pcss';

export const ChildrenList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    if (!selectedExclusion || selectedExclusion.children.length === 0) {
        return null;
    }

    const subtitle = exclusionsStore.currentMode === ExclusionsMode.Regular
        ? reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_regular_mode')
        : reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_selective_mode');

    const goBackHandler = () => {
        exclusionsStore.goBackHandler();
    };

    const openResetServiceModal = () => {
        exclusionsStore.setResetServiceModalOpen(true);
    };

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const isModifiedService = selectedExclusion.type === ExclusionsType.Service
        && !exclusionsStore.isServiceDefaultState(selectedExclusion.id);

    const isExclusionsGroup = selectedExclusion.type === ExclusionsType.Group
        && !isTopLevel(selectedExclusion.hostname);

    const renderResetButton = () => {
        return (
            <button
                type="button"
                className="button button--medium button--outline-gray children-list__reset"
                onClick={openResetServiceModal}
            >
                {reactTranslator.getMessage('settings_exclusion_reset_to_default')}
            </button>
        );
    };

    const renderAddSubdomainButton = () => {
        return (
            <button
                type="button"
                className="children-list__add-subdomain simple-button"
                onClick={onAddSubdomainClick}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#plus" />
                </svg>
                <div className="children-list__add-subdomain__text">
                    {reactTranslator.getMessage('settings_exclusion_add_subdomain')}
                </div>
            </button>
        );
    };

    const renderExclusions = () => exclusionsStore.sortedExclusions?.map((exclusion) => {
        if (exclusion) {
            return <ChildrenListItem exclusion={exclusion} key={exclusion.id} />;
        }
        return undefined;
    });

    return (
        <>
            <div className="children-list__title">
                <button className="back-button" type="button" onClick={goBackHandler}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#back-arrow" />
                    </svg>
                </button>
                <div>
                    <Title
                        title={selectedExclusion.hostname}
                        subtitle={subtitle}
                        onClick={goBackHandler}
                    />
                </div>
            </div>
            <div>
                {renderExclusions()}
            </div>
            {isModifiedService && renderResetButton()}
            {isExclusionsGroup && renderAddSubdomainButton()}
            <SubdomainModal />
            <ResetServiceModal />
        </>
    );
});
