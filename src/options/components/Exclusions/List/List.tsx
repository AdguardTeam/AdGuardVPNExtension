import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { ExclusionsTypes } from '../../../../common/exclusionsConstants';
import { StateCheckbox } from '../StateCheckbox';
import { rootStore } from '../../../stores';
import { SearchHighlighter } from '../Search/SearchHighlighter';

import './list.pcss';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const removeExclusion = (id: string, type: ExclusionsTypes) => () => {
        exclusionsStore.removeExclusion(id, type);
    };

    const toggleState = (id: string, type: ExclusionsTypes) => () => {
        exclusionsStore.toggleExclusionState(id, type);
    };

    const showExclusionSettings = (id: string, type: ExclusionsTypes) => () => {
        if (type !== ExclusionsTypes.Ip) {
            exclusionsStore.setExclusionIdToShowSettings(id);
        }
    };

    const listIndexTitleClasses = (type: ExclusionsTypes) => cn('list__index__title', {
        'ip-title': type === ExclusionsTypes.Ip,
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
        // eslint-disable-next-line react/jsx-no-useless-fragment
        <>
            {renderedExclusions}
        </>
    );
});
