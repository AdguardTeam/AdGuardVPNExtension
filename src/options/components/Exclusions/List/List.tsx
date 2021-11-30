import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { ListItem } from './ListItem';
import { rootStore } from '../../../stores';

export const List = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    return (
        <ul>
            {
                exclusionsStore.preparedExclusions.map((exclusion) => (
                    <ListItem exclusion={exclusion} />
                ))
            }
        </ul>
    );
});
