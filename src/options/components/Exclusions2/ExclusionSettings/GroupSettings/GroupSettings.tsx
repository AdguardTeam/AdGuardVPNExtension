import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { StateBox } from '../../StateBox';
import { EXCLUSIONS_MODES, TYPE } from '../../../../../common/exclusionsConstants';
import { SubdomainModal } from '../SubdomainModal';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './group-settings.pcss';

// FIXME remove @ts-ignore
// @ts-ignore
export const GroupSettings = observer(({ exclusionData, parentServiceId }) => {
    const { exclusionsStore } = useContext(rootStore);

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

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const subtitle = exclusionsStore.currentMode === EXCLUSIONS_MODES.REGULAR
        ? reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_regular_mode')
        : reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_selecive_mode');

    // FIXME remove any
    const renderedExclusions = exclusionData.exclusions.map((exclusion: any, index: number) => {
        return (
            <div
                className="group__settings__domain"
                key={exclusion.hostname}
            >
                <StateBox
                    id={exclusion.id}
                    type={TYPE.GROUP}
                    state={exclusion.enabled}
                    toggleHandler={toggleState}
                />
                <div className="group__settings__domain__hostname">
                    {exclusion.hostname}
                    <div className="group__settings__domain__hostname__status">
                        {/* TODO handle status properly */}
                        {index === 0 ? 'domain' : 'subdomain'}
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
