import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { type ExclusionDtoInterface, ExclusionState, ExclusionsType } from '../../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { rootStore } from '../../../../stores';
import { Icon } from '../../../ui/Icon';
import { SearchHighlighter } from '../Search';

import './exclusion.pcss';

export interface ExclusionProps {
    exclusion: ExclusionDtoInterface;
    hasIcon?: boolean;
}

const ICON_FOR_DOMAIN = 'https://icons.adguardvpn.com/icon?domain=';

function getIconUrl(exclusion: ExclusionDtoInterface) {
    if (exclusion.type === ExclusionsType.Service && exclusion.iconUrl) {
        return exclusion.iconUrl;
    }

    if (exclusion.type === ExclusionsType.Group) {
        return `${ICON_FOR_DOMAIN}${exclusion.hostname}`;
    }

    return null;
}

function getCheckIconName(state: ExclusionState) {
    switch (state) {
        case ExclusionState.Disabled: {
            return 'checkbox-disabled';
        }
        case ExclusionState.Enabled: {
            return 'checkbox-enabled';
        }
        case ExclusionState.PartlyEnabled:
        default: {
            return 'checkbox-partly-enabled';
        }
    }
}

function getStateClassName(state: ExclusionState) {
    switch (state) {
        case ExclusionState.Disabled: {
            return 'exclusion--disabled';
        }
        case ExclusionState.Enabled: {
            return 'exclusion--enabled';
        }
        case ExclusionState.PartlyEnabled:
        default: {
            return 'exclusion--partly-enabled';
        }
    }
}

function getExclusionDescription(hostname: string, exclusion?: ExclusionDtoInterface | null) {
    if (hostname === exclusion?.hostname) {
        return reactTranslator.getMessage('settings_exclusion_status_domain');
    }
    if (hostname.startsWith('*')) {
        return reactTranslator.getMessage('settings_exclusion_status_all_subdomains');
    }
    return reactTranslator.getMessage('settings_exclusion_status_subdomain');
}

function isUselessExclusion(hostname: string, exclusion?: ExclusionDtoInterface | null) {
    const wildcardExclusion = `*.${exclusion?.hostname}`;

    return (
        hostname !== exclusion?.hostname
        && !hostname.startsWith(wildcardExclusion)
        && exclusion?.children.some((exclusion) => {
            return exclusion.hostname.startsWith(wildcardExclusion)
                && exclusion.state === ExclusionState.Enabled;
        })
    );
}

export const Exclusion = observer(({
    exclusion,
    hasIcon = false,
}: ExclusionProps) => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    const [iconLoaded, setIconLoaded] = useState(false);

    const hasChildren = exclusion.children.length !== 0;
    const isGroupExclusion = selectedExclusion?.type === ExclusionsType.Group;
    const description = getExclusionDescription(exclusion.hostname, selectedExclusion);
    const isUseless = isUselessExclusion(exclusion.hostname, selectedExclusion);

    const classes = classNames(
        'exclusion',
        getStateClassName(exclusion.state),
        iconLoaded && 'exclusion--icon-loaded',
        isGroupExclusion && 'exclusion--group',
        isUseless && 'exclusion--useless',
    );

    const checkIconName = getCheckIconName(exclusion.state);
    const iconUrl = getIconUrl(exclusion);

    const handleIconLoaded = () => {
        setIconLoaded(true);
    };

    const handleClick = () => {
        exclusionsStore.toggleExclusionState(exclusion.id);
    };

    const handleForwardClick = () => {
        if (!hasChildren) {
            handleClick();
            return;
        }

        exclusionsStore.setSelectedExclusionId(exclusion.id);
    };

    const handleDeleteClick = async () => {
        const deletedExclusionsCount = await exclusionsStore.removeExclusion(exclusion);
        const message = reactTranslator.getMessage(
            'options_exclusions_deleted_exclusions',
            { count: deletedExclusionsCount },
        );
        notificationsStore.notifySuccess(message, {
            action: reactTranslator.getMessage('settings_exclusions_undo'),
            handler: () => exclusionsStore.restoreExclusions(),
        });
    };

    return (
        <div className={classes}>
            <div className="exclusion__wrapper">
                <button className="exclusion__check" type="button" onClick={handleClick}>
                    <Icon name={checkIconName} className="exclusion__check-icon" />
                </button>
                <button className="exclusion__btn" type="button" onClick={handleForwardClick}>
                    <span className="exclusion__btn-content">
                        {hasIcon && (
                            <>
                                {iconUrl && (
                                    <img
                                        src={iconUrl}
                                        alt={exclusion.hostname}
                                        onLoad={handleIconLoaded}
                                        className="exclusion__btn-icon"
                                    />
                                )}
                                <Icon name="globe" className="exclusion__btn-globe-icon" />
                            </>
                        )}
                        <span className="exclusion__btn-title">
                            <SearchHighlighter
                                value={exclusion.hostname}
                                search={exclusionsStore.exclusionsSearchValue}
                            />
                        </span>
                        {hasChildren && (
                            <Icon name="arrow-down" className="exclusion__btn-forward-icon" />
                        )}
                    </span>
                    {isGroupExclusion && description && (
                        <span className="exclusion__btn-description">
                            {description}
                        </span>
                    )}
                </button>
                <button className="exclusion__delete" type="button" onClick={handleDeleteClick}>
                    <Icon name="basket" className="exclusion__delete-icon" />
                </button>
            </div>
        </div>
    );
});
