import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import './exclusions-list.pcss';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const renderedExclusions = exclusionsStore.preparedExclusions.map((exclusion) => {
        return (
            <li key={exclusion}>{exclusion}</li>
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
