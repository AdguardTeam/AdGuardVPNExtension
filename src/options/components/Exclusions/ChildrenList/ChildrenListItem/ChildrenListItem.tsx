import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { toJS } from 'mobx';
import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { StateCheckbox } from '../../StateCheckbox';
import { ExclusionDtoInterface, ExclusionsModes } from '../../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { translator } from '../../../../../common/translator';

import './children-list-item.pcss';

interface GroupSettingsProps {
    exclusions: ExclusionDtoInterface[];
    parentId: string | null;
}

export const ChildrenListItem = observer(({ exclusions, parentId }: GroupSettingsProps) => {
    const { exclusionsStore } = useContext(rootStore);

    if (!exclusions) {
        return null;
    }

    const goBack = () => {
        exclusionsStore.setExclusionIdToShowSettings(parentId || null);
    };

    const toggleState = (id: string) => async () => {
        await exclusionsStore.toggleExclusionState(id);
    };

    const removeDomain = (id: string) => async () => {
        await exclusionsStore.removeExclusion(id);
    };

    const getExclusionDescription = (hostname: string) => {
        // if (hostname === exclusions.hostname) {
        //     return translator.getMessage('settings_exclusion_status_domain');
        // }
        if (hostname.startsWith('*')) {
            return translator.getMessage('settings_exclusion_status_all_subdomains');
        }
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
        console.log(toJS(exclusion));
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
                        {getExclusionDescription(exclusion.value)}
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
             {/*<SubdomainModal*/}
             {/*   exclusionData={exclusions}*/}
             {/*   parentServiceId={parentId}*/}
             {/*/>*/}
        </div>
    );
});
