import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore} from '../../../../stores';
import { StateCheckbox } from '../../StateCheckbox';
import { ExclusionDtoInterface, ExclusionStates } from '../../../../../common/exclusionsConstants';
import { SubdomainModal } from '../SubdomainModal';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { translator } from '../../../../../common/translator';

import './exclusions-list.pcss';

export const ExclusionsList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const toggleState = (id: string) => () => {
        exclusionsStore.toggleExclusionState(id);
    };

    const removeExclusion = (id: string) => () => {
        exclusionsStore.removeExclusion(id);
    };

    const selectedExclusion = exclusionsStore.selectedExclusion;

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

    const exclusionClassNames = (hostname: string) => classnames('group__settings__domain', {
        useless: hostname !== selectedExclusion.value
            && !hostname.startsWith('*')
            && selectedExclusion.children.some((exclusion) => {
                return exclusion.value.startsWith('*')
                    && exclusion.state === ExclusionStates.Enabled;
            }),
    });


    return (
        <div className="group">
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
                            <div className="group__settings__domain__hostname">
                                {exclusion.value}
                                <div className="group__settings__domain__hostname__status">
                                    {getExclusionStatus(exclusion.value)}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="group__settings__domain__remove-button"
                                onClick={removeExclusion(exclusion.id)}
                            >
                                <svg className="group__settings__domain__remove-button__icon">
                                    <use xlinkHref="#basket" />
                                </svg>
                            </button>
                        </div>
                    );
                })
            }
            <button
                type="button"
                className="group__add-subdomain simple-button"
                onClick={onAddSubdomainClick}
            >
                {reactTranslator.getMessage('settings_exclusion_add_subdomain')}
            </button>
            <SubdomainModal />
        </div>
    );
});
