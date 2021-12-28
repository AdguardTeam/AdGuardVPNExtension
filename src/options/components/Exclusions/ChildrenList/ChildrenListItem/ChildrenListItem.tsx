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
import { translator } from '../../../../../common/translator';

import './children-list-item.pcss';

interface ChildrenListItemProps {
    exclusion: ExclusionDtoInterface;
}

export const ChildrenListItem = observer(({ exclusion }: ChildrenListItemProps) => {
    const { exclusionsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    const toggleState = (id: string) => () => {
        exclusionsStore.toggleExclusionState(id);
    };

    const removeExclusion = (exclusion: ExclusionDtoInterface) => async () => {
        await exclusionsStore.removeExclusion(exclusion);
    };

    const showGroupSettings = (id: string) => () => {
        exclusionsStore.setSelectedExclusionId(id);
    };

    const getExclusionStatus = (hostname: string) => {
        if (hostname === selectedExclusion?.value) {
            return translator.getMessage('settings_exclusion_status_domain');
        }
        if (hostname.startsWith('*')) {
            return translator.getMessage('settings_exclusion_status_all_subdomains');
        }
        return translator.getMessage('settings_exclusion_status_subdomain');
    };

    const wildcardExclusion = `*.${selectedExclusion?.value}`;

    const exclusionClassNames = (hostname: string) => classnames('children-list-item', {
        'service-exclusion': selectedExclusion?.type === ExclusionsTypes.Service,
        useless: hostname !== selectedExclusion?.value
            && !hostname.startsWith(wildcardExclusion)
            && selectedExclusion?.children.some((exclusion) => {
                return exclusion.value.startsWith(wildcardExclusion)
                    && exclusion.state === ExclusionState.Enabled;
            }),
    });

    // TODO refactor renderExclusion
    const renderExclusion = (exclusion: ExclusionDtoInterface) => {
        if (selectedExclusion?.type === ExclusionsTypes.Service) {
            return (
                <div
                    className="children-list-item__service-hostname"
                    onClick={showGroupSettings(exclusion.id)}
                >
                    {exclusion.value}
                </div>
            );
        }
        return (
            <div className="children-list-item__group-hostname">
                {exclusion.value}
                <div className="children-list-item__group-hostname__status">
                    {getExclusionStatus(exclusion.value)}
                </div>
            </div>
        );
    };

    return (
        <div
            className={exclusionClassNames(exclusion.value)}
            key={exclusion.value}
        >
            <StateCheckbox
                id={exclusion.id}
                state={exclusion.state}
                toggleHandler={toggleState}
            />
            {renderExclusion(exclusion)}
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
