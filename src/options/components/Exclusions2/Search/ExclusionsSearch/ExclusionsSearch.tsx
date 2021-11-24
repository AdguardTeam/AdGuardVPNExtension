import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Search } from '../Search';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

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
            placeholder={reactTranslator.getMessage('settings_exclusion_search_website')}
            value={exclusionsStore.exclusionsSearchValue}
            onChange={onChange}
            onClear={onClear}
        />
    );
});
