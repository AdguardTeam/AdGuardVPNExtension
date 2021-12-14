import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore} from '../../../../stores';
import { StateCheckbox } from '../../StateCheckbox';
import {
    ExclusionDtoInterface,
    ExclusionStates,
    ExclusionsTypes,
} from '../../../../../common/exclusionsConstants';
import { SubdomainModal } from '../SubdomainModal';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { translator } from '../../../../../common/translator';

import './exclusions-list.pcss';

export const ExclusionsList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const selectedExclusion = exclusionsStore.selectedExclusion;

    const toggleState = (id: string) => () => {
        exclusionsStore.toggleExclusionState(id);
    };

    const removeExclusion = (id: string) => () => {
        exclusionsStore.removeExclusion(id);
    };

    const resetServiceData = async () => {
        // TODO reset service data
    };

    const showGroupSettings = (id: string) => () => {
        exclusionsStore.setSelectedExclusionId(id);
    };

    const getExclusionStatus = (hostname: string) => {
        if (hostname === selectedExclusion.value) {
            return translator.getMessage('settings_exclusion_status_domain');
        }
        if (hostname.startsWith('*')) {
            return translator.getMessage('settings_exclusion_status_all_subdomains');
        }
        return translator.getMessage('settings_exclusion_status_subdomain');
    };

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const exclusionClassNames = (hostname: string) => classnames('exclusions-list__item', {
        'service-exclusion': selectedExclusion.type === ExclusionsTypes.Service,
        'group-exclusion': selectedExclusion.type === ExclusionsTypes.Group,
        useless: hostname !== selectedExclusion.value
            && !hostname.startsWith('*')
            && selectedExclusion.children.some((exclusion) => {
                return exclusion.value.startsWith('*')
                    && exclusion.state === ExclusionStates.Enabled;
            }),
    });

    const resetButtonClass = classnames(
        'button',
        'button--medium',
        'button--outline-gray',
        'exclusions-list__reset',
        { hidden: selectedExclusion.type !== ExclusionsTypes.Service },
    );

    const addSubdomainButtonClass = classnames(
        'exclusions-list__add-subdomain',
        'simple-button',
        { hidden: selectedExclusion.type !== ExclusionsTypes.Group },
    );

    const renderExclusion = (exclusion: ExclusionDtoInterface) => {
        if (selectedExclusion.type === ExclusionsTypes.Service) {
            return (
                <div
                    className="exclusions-list__item__hostname1"
                    onClick={showGroupSettings(exclusion.id)}
                >
                    {exclusion.value}
                </div>
            );
        } else {
            return (
                <div className="exclusions-list__item__hostname2">
                    {exclusion.value}
                    <div className="exclusions-list__item__hostname2__status">
                        {getExclusionStatus(exclusion.value)}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="exclusions-list">
            {
                selectedExclusion.children.map((exclusion: ExclusionDtoInterface) => {
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
                                className="exclusions-list__item__remove-button"
                                onClick={removeExclusion(exclusion.id)}
                            >
                                <svg className="exclusions-list__item__remove-button__icon">
                                    <use xlinkHref="#basket" />
                                </svg>
                            </button>
                        </div>
                    );
                })
            }
            <button
                type="button"
                className={resetButtonClass}
                onClick={resetServiceData}
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
        </div>
    );
});
