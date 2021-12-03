import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { StateCheckbox } from '../../StateCheckbox';
import { ExclusionsModes, ExclusionsTypes } from '../../../../../common/exclusionsConstants';
import { SubdomainModal } from '../SubdomainModal';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { translator } from '../../../../../common/translator';
import { ExclusionsGroup } from '../../../../../background/exclusions/ExclusionsGroup';

import './group-settings.pcss';

interface GroupSettingsProps {
    exclusionData: ExclusionsGroup | null;
    parentServiceId: string | null;
}

export const GroupSettings = observer(({ exclusionData, parentServiceId }: GroupSettingsProps) => {
    const { exclusionsStore } = useContext(rootStore);

    if (!exclusionData) {
        return null;
    }

    const goBack = () => {
        exclusionsStore.setExclusionIdToShowSettings(null);
    };

    const toggleState = (subdomainId: string) => async () => {
        if (parentServiceId) {
            await exclusionsStore.toggleSubdomainStateInExclusionsGroupInService(
                parentServiceId,
                exclusionData.id,
                subdomainId,
            );
            return;
        }
        await exclusionsStore.toggleSubdomainStateInExclusionsGroup(exclusionData.id, subdomainId);
    };

    const removeDomain = (subdomainId: string) => async () => {
        if (parentServiceId) {
            await exclusionsStore.removeSubdomainFromExclusionsGroupInService(
                parentServiceId,
                exclusionData.id,
                subdomainId,
            );
            return;
        }
        await exclusionsStore.removeSubdomainFromExclusionsGroup(exclusionData.id, subdomainId);
    };

    const getExclusionStatus = (hostname: string) => {
        if (hostname === exclusionData.hostname) {
            return translator.getMessage('settings_exclusion_status_domain');
        }
        if (hostname.startsWith('*')) {
            return translator.getMessage('settings_exclusion_status_all_subdomains');
        }
        return translator.getMessage('settings_exclusion_status_subdomain');
    }

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const subtitle = exclusionsStore.currentMode === ExclusionsModes.Regular
        ? translator.getMessage('settings_exclusion_group_settings_subtitle_regular_mode')
        : translator.getMessage('settings_exclusion_group_settings_subtitle_selective_mode');

    const renderedExclusions = exclusionData.exclusions.map((exclusion, index) => {
        return (
            <div
                className="group__settings__domain"
                key={exclusion.hostname}
            >
                <StateCheckbox
                    id={exclusion.id}
                    type={ExclusionsTypes.Group}
                    state={exclusion.enabled}
                    toggleHandler={toggleState}
                />
                <div className="group__settings__domain__hostname">
                    {exclusion.hostname}
                    <div className="group__settings__domain__hostname__status">
                        {getExclusionStatus(exclusion.hostname)}
                    </div>
                </div>
                <button
                    type="button"
                    className="group__settings__domain__remove-button"
                    onClick={removeDomain(exclusion.id)}
                >
                    <svg className="group__settings__domain__remove-button__icon">
                        <use xlinkHref="#basket" />
                    </svg>
                </button>
            </div>
        );
    });

    return (
        <div className="group">
            <div className="group__title">
                <button className="group__back-button back-button" type="button" onClick={goBack}>
                    <svg className="icon icon--button">
                        <use xlinkHref="#arrow" />
                    </svg>
                </button>
                <Title
                    title={exclusionData.hostname}
                    subtitle={subtitle}
                />
            </div>
            <div className="group__settings">
                {renderedExclusions}
            </div>
            <button
                type="button"
                className="group__add-subdomain simple-button"
                onClick={onAddSubdomainClick}
            >
                {reactTranslator.getMessage('settings_exclusion_add_subdomain')}
            </button>
            <SubdomainModal
                exclusionData={exclusionData}
                parentServiceId={parentServiceId}
            />
        </div>
    );
});
