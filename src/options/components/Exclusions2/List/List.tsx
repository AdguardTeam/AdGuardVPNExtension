import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { TYPE } from '../../../../common/exclusionsConstants';
import { StateCheckbox } from '../StateCheckbox';
import { rootStore } from '../../../stores';

import './list.pcss';
import { SearchHighlighter } from '../Search/SearchHighlighter';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const removeExclusion = (id: string, type: TYPE) => () => {
        exclusionsStore.removeExclusion(id, type);
    };

    const toggleState = (id: string, type: TYPE) => () => {
        exclusionsStore.toggleExclusionState(id, type);
    };

    const showExclusionSettings = (id: string, type: TYPE) => () => {
        if (type !== TYPE.IP) {
            exclusionsStore.setExclusionIdToShowSettings(id);
        }
    };

    const listIndexTitleClasses = (type: TYPE) => cn('list__index__title', {
        'ip-title': type === TYPE.IP,
    });

    const renderedExclusions = exclusionsStore.preparedExclusions.map((exclusion) => {
        return (
            <li
                key={exclusion.name}
                className="list__index"
            >
                <StateCheckbox
                    id={exclusion.id}
                    type={exclusion.type}
                    state={exclusion.state}
                    toggleHandler={toggleState}
                />
                <div
                    className={listIndexTitleClasses(exclusion.type)}
                    onClick={showExclusionSettings(exclusion.id, exclusion.type)}
                >
                    <img
                        src={exclusion.iconUrl}
                        className="list__index__title__icon"
                        alt="exclusion icon"
                    />
                    <SearchHighlighter
                        value={exclusion.name}
                        search={exclusionsStore.exclusionsSearchValue}
                    />
                </div>
                <button
                    type="button"
                    className="list__index__remove-button"
                    onClick={removeExclusion(exclusion.id, exclusion.type)}
                >
                    <svg className="list__index__remove-button__icon">
                        <use xlinkHref="#basket" />
                    </svg>
                </button>
            </li>
        );
    });

    return (
        <>
            {renderedExclusions}
        </>
    );
});
