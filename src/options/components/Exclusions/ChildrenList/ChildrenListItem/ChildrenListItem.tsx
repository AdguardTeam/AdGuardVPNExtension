import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../../stores';
import { StateCheckbox } from '../../StateCheckbox';
import {
    ExclusionDtoInterface,
    ExclusionState,
    ExclusionsTypes,
} from '../../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './children-list-item.pcss';

interface ChildrenListItemProps {
    exclusion: ExclusionDtoInterface;
}

export const ChildrenListItem = observer(({ exclusion }: ChildrenListItemProps) => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    const toggleState = (id: string) => () => {
        exclusionsStore.toggleExclusionState(id);
    };

    const removeExclusion = (exclusion: ExclusionDtoInterface) => async () => {
        const deletedExclusionsCount = await exclusionsStore.removeExclusion(exclusion);
        notificationsStore.notifySuccess(reactTranslator.getMessage(
            'options_exclusions_deleted_domains',
            { count: deletedExclusionsCount },
        ));
    };

    const showGroupSettings = (id: string) => () => {
        exclusionsStore.setSelectedExclusionId(id);
    };

    const getExclusionStatus = (hostname: string) => {
        if (hostname === selectedExclusion?.hostname) {
            return reactTranslator.getMessage('settings_exclusion_status_domain');
        }
        if (hostname.startsWith('*')) {
            return reactTranslator.getMessage('settings_exclusion_status_all_subdomains');
        }
        return reactTranslator.getMessage('settings_exclusion_status_subdomain');
    };

    const wildcardExclusion = `*.${selectedExclusion?.hostname}`;

    const exclusionClassNames = (hostname: string) => classnames('children-list-item', {
        'service-exclusion': selectedExclusion?.type === ExclusionsTypes.Service,
        useless: hostname !== selectedExclusion?.hostname
            && !hostname.startsWith(wildcardExclusion)
            && selectedExclusion?.children.some((exclusion) => {
                return exclusion.hostname.startsWith(wildcardExclusion)
                    && exclusion.state === ExclusionState.Enabled;
            }),
    });

    const renderServiceExclusionItem = () => {
        return (
            <div
                className="children-list-item__service-hostname"
                onClick={showGroupSettings(exclusion.id)}
            >
                {exclusion.hostname}
                <svg className="icon children-list-item__arrow">
                    <use xlinkHref="#arrow" />
                </svg>
            </div>
        );
    };

    const renderGroupExclusionItem = () => {
        return (
            <div className="children-list-item__group-hostname">
                {exclusion.hostname}
                <div className="children-list-item__group-hostname__status">
                    {getExclusionStatus(exclusion.hostname)}
                </div>
            </div>
        );
    };

    const renderExclusion = () => {
        return selectedExclusion?.type === ExclusionsTypes.Service
            ? renderServiceExclusionItem()
            : renderGroupExclusionItem();
    };

    return (
        <div
            className={exclusionClassNames(exclusion.hostname)}
            key={exclusion.hostname}
        >
            <StateCheckbox
                id={exclusion.id}
                state={exclusion.state}
                toggleHandler={toggleState}
            />
            {renderExclusion()}
            <button
                type="button"
                className="children-list-item__remove-button"
                onClick={removeExclusion(exclusion)}
            >
                <svg className="children-list-item__remove-button__icon">
                    <use xlinkHref="#basket" />
                </svg>
            </button>
        </div>
    );
});
