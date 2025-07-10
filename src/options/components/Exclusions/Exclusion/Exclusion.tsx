import React, { useContext, useRef, useState } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { type ExclusionDtoInterface, ExclusionState, ExclusionsType } from '../../../../common/exclusionsConstants';
import { translator } from '../../../../common/translator';
import { SearchHighlighter } from '../../../../common/components/SearchHighlighter';
import { Icon } from '../../../../common/components/Icons';
import { rootStore } from '../../../stores';

import './exclusion.pcss';

export interface ExclusionProps {
    exclusion: ExclusionDtoInterface;
    hasIcon?: boolean;
}

const ICONS_ORIGIN = 'https://icons.adguardvpn.com';

function getIconUrl(exclusion: ExclusionDtoInterface) {
    if (exclusion.type === ExclusionsType.Service && exclusion.iconUrl) {
        return exclusion.iconUrl;
    }

    if (exclusion.type === ExclusionsType.Group) {
        return `${ICONS_ORIGIN}/icon?domain=${exclusion.hostname}`;
    }

    return null;
}

function getExclusionDescription(hostname: string, exclusion?: ExclusionDtoInterface | null) {
    if (hostname === exclusion?.hostname) {
        return translator.getMessage('settings_exclusion_status_domain');
    }
    if (hostname.startsWith('*')) {
        return translator.getMessage('settings_exclusion_status_all_subdomains');
    }
    return translator.getMessage('settings_exclusion_status_subdomain');
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

    const checkboxRef = useRef<HTMLButtonElement>(null);
    const [iconLoaded, setIconLoaded] = useState(false);

    const hasChildren = exclusion.children.length !== 0;
    const isGroupExclusion = selectedExclusion?.type === ExclusionsType.Group;
    const isDomain = exclusion.hostname === selectedExclusion?.hostname;
    const description = getExclusionDescription(exclusion.hostname, selectedExclusion);
    const isUseless = isUselessExclusion(exclusion.hostname, selectedExclusion);

    const stateMap = {
        [ExclusionState.Disabled]: {
            icon: 'checkbox-disabled',
            className: 'exclusion--disabled',
        },
        [ExclusionState.Enabled]: {
            icon: 'checkbox-enabled',
            className: 'exclusion--enabled',
        },
        [ExclusionState.PartlyEnabled]: {
            icon: 'checkbox-partly-enabled',
            className: 'exclusion--partly-enabled',
        },
    };

    const classes = classNames(
        'exclusion',
        stateMap[exclusion.state].className,
        iconLoaded && 'exclusion--icon-loaded',
        isGroupExclusion && !isDomain && 'exclusion--group',
        isUseless && 'exclusion--useless',
    );

    const checkIconName = stateMap[exclusion.state].icon;
    const iconUrl = getIconUrl(exclusion);

    const handleIconLoaded = () => {
        setIconLoaded(true);
    };

    const toggleExclusionState = () => {
        exclusionsStore.toggleExclusionState(exclusion.id);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        /**
         * The detail property of the event is used to determine how the event was triggered.
         * A value of 0 indicates that the event was triggered by a keyboard action (e.g., pressing Enter or Space).
         */
        const KEYBOARD_EVENT_DETAIL = 0;

        /**
         * Prevent from remaining focus on the checkbox if the click is made by mouse or touch,
         * allow to keep focus on the checkbox for keyboard navigation.
         *
         * This is needed to avoid focused styles on exclusion after clicking it.
         */
        if (e.detail !== KEYBOARD_EVENT_DETAIL && checkboxRef.current) {
            checkboxRef.current.blur();
        }

        toggleExclusionState();
    };

    const handleForwardClick = () => {
        if (!hasChildren) {
            toggleExclusionState();
            return;
        }

        exclusionsStore.setSelectedExclusionId(exclusion.id);
    };

    const handleDeleteClick = async () => {
        const deletedExclusionsCount = await exclusionsStore.removeExclusion(exclusion);
        const message = translator.getMessage(
            'options_exclusions_deleted_exclusions',
            { count: deletedExclusionsCount },
        );
        notificationsStore.notifySuccess(message, {
            action: translator.getMessage('settings_exclusions_undo'),
            handler: () => exclusionsStore.restoreExclusions(),
        });
    };

    return (
        <div className={classes}>
            <div className="exclusion__wrapper">
                <button
                    ref={checkboxRef}
                    className="exclusion__check has-tab-focus"
                    type="button"
                    onClick={handleClick}
                >
                    <Icon name={checkIconName} />
                </button>
                <button
                    className="exclusion__btn has-tab-focus"
                    type="button"
                    onClick={handleForwardClick}
                >
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
                                <Icon
                                    name="globe"
                                    color="product"
                                    className="exclusion__btn-globe-icon"
                                />
                            </>
                        )}
                        <span className="exclusion__btn-title text-ellipsis">
                            <SearchHighlighter
                                value={exclusion.hostname}
                                search={exclusionsStore.exclusionsSearchValue}
                            />
                        </span>
                        {hasChildren && (
                            <Icon
                                name="arrow-down"
                                color="gray"
                                rotation="clockwise"
                                className="exclusion__btn-forward-icon"
                            />
                        )}
                    </span>
                    {isGroupExclusion && description && (
                        <span className="exclusion__btn-description">
                            {description}
                        </span>
                    )}
                </button>
                <button
                    className="exclusion__delete has-tab-focus"
                    type="button"
                    onClick={handleDeleteClick}
                >
                    <Icon name="basket" />
                </button>
            </div>
        </div>
    );
});
