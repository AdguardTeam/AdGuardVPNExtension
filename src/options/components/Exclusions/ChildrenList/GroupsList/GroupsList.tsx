import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../../stores';
import { StateCheckbox } from '../../StateCheckbox';
import { ExclusionDtoInterface } from '../../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './groups-list.pcss';

export const GroupsList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);


    const showGroupSettings = (id: string) => () => {
        exclusionsStore.setSelectedExclusionId(id);
    };

    const toggleState = (id: string) => () => {
        exclusionsStore.toggleExclusionState(id);
    };

    const removeExclusion = (id: string) => () => {
        exclusionsStore.removeExclusion(id);
    };

    const resetServiceData = async () => {
        // TODO reset service data
    };

    const resetButtonClass = classnames(
        'button',
        'button--medium',
        'button--outline-gray',
        'service__reset',
        { hidden: false },
    );

    const selectedExclusion = exclusionsStore.selectedExclusion;

    return (
        <div className="service">
            {
                selectedExclusion.children.map((exclusion: ExclusionDtoInterface) => {
                    return (
                        <div
                            className="service__settings__group"
                            key={exclusion.value}
                        >
                            <StateCheckbox
                                id={exclusion.id}
                                state={exclusion.state}
                                toggleHandler={toggleState}
                            />
                            <div
                                className="service__settings__group__hostname"
                                onClick={showGroupSettings(exclusion.id)}
                            >
                                {exclusion.value}
                            </div>
                            <button
                                type="button"
                                className="service__settings__group__remove-button"
                                onClick={removeExclusion(exclusion.id)}
                            >
                                <svg className="service__settings__group__remove-button__icon">
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
        </div>
    );
});
