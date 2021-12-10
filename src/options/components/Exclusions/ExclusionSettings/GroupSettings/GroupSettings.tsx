import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { StateCheckbox } from '../../StateCheckbox';
import {
    ExclusionDtoInterface,
    ExclusionsModes,
    ExclusionStates,
    ExclusionsTypes,
} from '../../../../../common/exclusionsConstants';
import { SubdomainModal } from '../SubdomainModal';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { translator } from '../../../../../common/translator';

import './group-settings.pcss';

interface GroupSettingsProps {
    exclusions: ExclusionDtoInterface[];
    parentId: string | null;
}

export const GroupSettings = observer(({ exclusions, parentId }: GroupSettingsProps) => {
    const { exclusionsStore } = useContext(rootStore);

    if (!exclusions) {
        return null;
    }

    const goBack = () => {
        exclusionsStore.setExclusionIdToShowSettings(parentId || null);
    };

    const toggleState = (subdomainId: string) => async () => {
        // if (parentId) {
        //     await exclusionsStore.toggleSubdomainStateInExclusionsGroupInService(
        //         parentId,
        //         exclusions.id,
        //         subdomainId,
        //     );
        //     return;
        // }
        // await exclusionsStore.toggleSubdomainStateInExclusionsGroup(exclusions.id, subdomainId);
    };

    const removeDomain = (subdomainId: string) => async () => {
        if (parentId) {
            await exclusionsStore.removeSubdomainFromExclusionsGroupInService(
                parentId,
                exclusions.id,
                subdomainId,
            );
            return;
        }
        await exclusionsStore.removeSubdomainFromExclusionsGroup(exclusions.id, subdomainId);
    };

    const getExclusionStatus = (hostname: string) => {
        // if (hostname === exclusions.hostname) {
        //     return translator.getMessage('settings_exclusion_status_domain');
        // }
        // if (hostname.startsWith('*')) {
        //     return translator.getMessage('settings_exclusion_status_all_subdomains');
        // }
        return translator.getMessage('settings_exclusion_status_subdomain');
    };

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const exclusionClassNames = (hostname: string) => classnames('group__settings__domain', {
        // useless: hostname !== exclusions.hostname
        //     && !hostname.startsWith('*')
        //     && exclusions.exclusions.some((exclusion) => {
        //         return exclusion.hostname.startsWith('*')
        //             && exclusion.enabled === ExclusionStates.Enabled;
        //     }),
    });

    const subtitle = exclusionsStore.currentMode === ExclusionsModes.Regular
        ? translator.getMessage('settings_exclusion_group_settings_subtitle_regular_mode')
        : translator.getMessage('settings_exclusion_group_settings_subtitle_selective_mode');

    const renderedExclusions = exclusions.map((exclusion) => {
        return (
            <div
                className={exclusionClassNames(exclusion.value)}
                key={exclusion.id}
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
                    // FIXME get title from parent
                    // title={exclusions.hostname}
                    title="FIXME"
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
            {/* <SubdomainModal */}
            {/*    exclusionData={exclusions} */}
            {/*    parentServiceId={parentId} */}
            {/* /> */}
        </div>
    );
});
