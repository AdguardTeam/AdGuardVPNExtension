import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { StateCheckbox } from '../../StateCheckbox';
import { ExclusionsModes, ExclusionsTypes, ExclusionStates } from '../../../../../common/exclusionsConstants';
import { ExclusionsGroup } from '../../../../../background/exclusions/exclusions/ExclusionsGroup';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { translator } from '../../../../../common/translator';

import './service-settings.pcss';

interface ServiceSettingsProps {
    exclusionData: {
        serviceId: string,
        serviceName: string,
        state: ExclusionStates,
        exclusionsGroups: ExclusionsGroup[],
    }
}

export const ServiceSettings = observer(({ exclusionData }: ServiceSettingsProps) => {
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

    const subtitle = exclusionsStore.currentMode === ExclusionsModes.Regular
        ? translator.getMessage('settings_exclusion_service_settings_subtitle_regular_mode')
        : translator.getMessage('settings_exclusion_service_settings_subtitle_selective_mode');

    const isModifiedService = () => {
        const defaultServiceData = exclusionsStore.servicesData
            .find(({ serviceId }) => serviceId === exclusionData.serviceId);
        return exclusionData.exclusionsGroups.length === defaultServiceData?.exclusionsGroups.length
            && exclusionData.state === ExclusionStates.Enabled;
    };

    const resetButtonClass = classnames(
        'button',
        'button--medium',
        'button--outline-secondary',
        'service__reset',
        { hidden: isModifiedService() },
    );

    // FIXME remove any
    const renderedExclusionsGroups = exclusionData.exclusionsGroups.map((group: any) => {
        return (
            <div
                className="service__settings__group"
                key={group.hostname}
            >
                <StateCheckbox
                    id={group.id}
                    type={ExclusionsTypes.Group}
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
                className={resetButtonClass}
                onClick={resetServiceData}
            >
                {reactTranslator.getMessage('settings_exclusion_reset_to_default')}
            </button>
        </div>
    );
});
