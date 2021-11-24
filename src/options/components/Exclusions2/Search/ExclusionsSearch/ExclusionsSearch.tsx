import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Search } from '../Search';
import { rootStore } from '../../../../stores';

export const ExclusionsSearch = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const onChange = (value: string) => {
        exclusionsStore.setExclusionsSearchValue(value);
    };

    const onClear = () => {
        exclusionsStore.setExclusionsSearchValue('');
    };

    return (
        <Search
            // FIXME add to translations
            placeholder="Search website"
            value={exclusionsStore.exclusionsSearchValue}
            onChange={onChange}
            onClear={onClear}
        />
    );
});
