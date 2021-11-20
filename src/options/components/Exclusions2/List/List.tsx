import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TYPE } from '../../../../common/exclusionsConstants';
import { StateBox } from '../StateBox';
import { rootStore } from '../../../stores';

import './list.pcss';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const removeExclusion = (id: string, type: TYPE) => () => {
        exclusionsStore.removeExclusion(id, type);
    };

    const toggleState = (id: string, type: TYPE) => () => {
        exclusionsStore.toggleExclusionState(id, type);
    };

    const renderedExclusions = exclusionsStore.preparedExclusions.map((exclusion) => {
        return (
            <li
                key={exclusion.name}
                className="list__index"
            >
                <StateBox
                    id={exclusion.id}
                    type={exclusion.type}
                    state={exclusion.state}
                    toggleHandler={toggleState}
                />
                <img
                    src={exclusion.iconUrl}
                    className="list__index__icon"
                    alt="exclusion icon"
                />
                {exclusion.name}
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
        <div className="list">
            <ul>
                {renderedExclusions}
            </ul>
        </div>
    );
});
