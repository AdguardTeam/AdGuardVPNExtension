import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { ExclusionDtoInterface } from '../../../../../common/exclusionsConstants';
import { StateCheckbox } from '../../StateCheckbox';
import { rootStore } from '../../../../stores';
import { SearchHighlighter } from '../../Search/SearchHighlighter';

import './list-item.pcss';

interface ListItemProps {
    exclusion: ExclusionDtoInterface;
}

export const ListItem = observer(({ exclusion }: ListItemProps) => {
    const { exclusionsStore } = useContext(rootStore);

    const removeExclusion = (id: string) => async () => {
        await exclusionsStore.removeExclusion(id);
    };

    const toggleState = (id: string) => () => {
        exclusionsStore.toggleExclusionState(id);
    };

    const followToChildren = (exclusion: ExclusionDtoInterface) => () => {
        if (exclusion.children.length === 0) {
            return;
        }
        exclusionsStore.setSelectedExclusionId(exclusion.id);
    };

    const listIndexTitleClasses = (hasChildren: boolean) => cn('list-item__title', {
        'ip-title': !hasChildren,
    });

    return (
        <li
            key={exclusion.id}
            className="list-item"
        >
            <StateCheckbox
                id={exclusion.id}
                state={exclusion.state}
                toggleHandler={toggleState}
            />
            <div
                className={listIndexTitleClasses(exclusion.children.length > 0)}
                onClick={followToChildren(exclusion)}
            >
                {/* FIXME get icons for sites with icons service */}
                <img
                    src={exclusion.iconUrl || './assets/images/ip-icon.svg'}
                    className="list-item__title__icon"
                    alt="exclusion icon"
                />
                <SearchHighlighter
                    value={exclusion.value}
                    search={exclusionsStore.exclusionsSearchValue}
                />
            </div>
            <button
                type="button"
                className="list-item__remove-button"
                onClick={removeExclusion(exclusion.id)}
            >
                <svg className="list-item__remove-button__icon">
                    <use xlinkHref="#basket" />
                </svg>
            </button>
        </li>
    );
});
