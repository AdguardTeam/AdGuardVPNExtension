import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { Checkbox } from '../Checkbox';

import { rootStore } from '../../../stores';

import './list.pcss';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const removeExclusion = (id: string) => () => {
        exclusionsStore.removeExclusion(id);
    };

    const renderedExclusions = exclusionsStore.preparedExclusions.map((exclusion) => {
        return (
            <li
                key={exclusion.name}
                className="list__index"
            >
                <Checkbox
                    id={exclusion.id}
                    state={exclusion.state}
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
                    onClick={removeExclusion(exclusion.id)}
                >
                    <svg className="icon icon--support">
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
