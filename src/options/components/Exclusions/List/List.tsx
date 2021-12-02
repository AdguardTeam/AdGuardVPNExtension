import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { ListItem } from './ListItem';
import { rootStore } from '../../../stores';
import {reactTranslator} from '../../../../common/reactTranslator';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (exclusionsStore.exclusionsSearchValue && !exclusionsStore.preparedExclusions.length) {
        return (
            <div className="search__nothing-found">
                {reactTranslator.getMessage('settings_exclusion_nothing_found')}
            </div>
        )
    }

    return (
        <ul>
            {
                exclusionsStore.preparedExclusions.map((exclusion) => (
                    <ListItem exclusion={exclusion} key={exclusion.id} />
                ))
            }
        </ul>
    );
});
