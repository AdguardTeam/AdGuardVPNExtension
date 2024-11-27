import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { type ExclusionDtoInterface, ExclusionState, ExclusionsType } from '../../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { rootStore } from '../../../../stores';
import { Icon } from '../../../ui/Icon';
import { SearchHighlighter } from '../Search';

export interface RootListItemProps {
    exclusion: ExclusionDtoInterface;
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
            return 'root-list-item--disabled';
        }
        case ExclusionState.Enabled: {
            return 'root-list-item--enabled';
        }
        case ExclusionState.PartlyEnabled:
        default: {
            return 'root-list-item--partly-enabled';
        }
    }
}

export const RootListItem = observer(({ exclusion }: RootListItemProps) => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);

    const [iconLoaded, setIconLoaded] = useState(false);

    const hasChildren = exclusion.children.length !== 0;

    const classes = classNames(
        'root-list-item',
        getStateClassName(exclusion.state),
        iconLoaded && 'root-list-item--icon-loaded',
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
            <button className="root-list-item__btn" type="button" onClick={handleClick}>
                <Icon name={checkIconName} className="root-list-item__btn-check-icon" />
                {iconUrl && (
                    <img
                        src={iconUrl}
                        alt={exclusion.hostname}
                        onLoad={handleIconLoaded}
                        className="root-list-item__btn-icon"
                    />
                )}
                <Icon name="globe" className="root-list-item__btn-globe-icon" />
                <span className="root-list-item__btn-title">
                    <SearchHighlighter
                        value={exclusion.hostname}
                        search={exclusionsStore.exclusionsSearchValue}
                    />
                </span>
            </button>
            <button className="root-list-item__delete" type="button" onClick={handleDeleteClick}>
                <Icon name="basket" className="root-list-item__delete-icon" />
            </button>
            {hasChildren && (
                <button className="root-list-item__forward" type="button" onClick={handleForwardClick}>
                    <Icon name="arrow-down" className="root-list-item__forward-icon" />
                </button>
            )}
        </div>
    );
});
