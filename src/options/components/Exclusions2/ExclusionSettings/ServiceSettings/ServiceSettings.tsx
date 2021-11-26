import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { StateBox } from '../../StateBox';
import { EXCLUSIONS_MODES, TYPE } from '../../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './service-settings.pcss';

// FIXME remove @ts-ignore
// @ts-ignore
export const ServiceSettings = observer(({ exclusionData }) => {
    const { exclusionsStore } = useContext(rootStore);

    const goBack = () => {
        exclusionsStore.setExclusionIdToShowSettings(null);
    };

    const showGroupSettings = (id: string) => () => {
        exclusionsStore.setExclusionIdToShowSettings(id);
    };

    const toggleState = (id: string) => async () => {
        await exclusionsStore.toggleExclusionsGroupStateInService(exclusionData.serviceId, id);
    };

    const removeExclusionsGroup = (id: string) => async () => {
        await exclusionsStore.removeExclusionsGroupFromService(exclusionData.serviceId, id);
    };

    const resetServiceData = async () => {
        await exclusionsStore.resetServiceData(exclusionData.serviceId);
    };

    const subtitle = exclusionsStore.currentMode === EXCLUSIONS_MODES.REGULAR
        ? reactTranslator.getMessage('settings_exclusion_service_settings_subtitle_regular_mode')
        : reactTranslator.getMessage('settings_exclusion_service_settings_subtitle_selective_mode');

    // FIXME remove any
    const renderedExclusionsGroups = exclusionData.exclusionsGroups.map((group: any) => {
        return (
            <div
                className="service__settings__group"
                key={group.hostname}
            >
                <StateBox
                    id={group.id}
                    type={TYPE.GROUP}
                    state={group.state}
                    toggleHandler={toggleState}
                />
                <div
                    className="service__settings__group__hostname"
                    onClick={showGroupSettings(group.id)}
                >
                    {group.hostname}
                </div>
                <button
                    type="button"
                    className="service__settings__group__remove-button"
                    onClick={removeExclusionsGroup(group.id)}
                >
                    <svg className="service__settings__group__remove-button__icon">
                        <use xlinkHref="#basket" />
                    </svg>
                </button>
            </div>
        );
    });

    return (
        <div className="service">
            <div className="service__title">
                <button className="service__back-button back-button" type="button" onClick={goBack}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#arrow" />
                    </svg>
                </button>
                <Title
                    title={exclusionData.serviceName}
                    subtitle={subtitle}
                />
            </div>
            <div className="service__settings">
                {renderedExclusionsGroups}
            </div>
            <button
                type="button"
                className="button button--medium button--outline-secondary service__reset"
                onClick={resetServiceData}
            >
                {reactTranslator.getMessage('settings_exclusion_reset_to_default')}
            </button>
        </div>
    );
});
