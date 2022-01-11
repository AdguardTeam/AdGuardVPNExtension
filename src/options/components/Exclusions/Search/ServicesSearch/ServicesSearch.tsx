import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Search } from '../Search';
import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

export const ServicesSearch = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const onChange = (value: string) => {
        exclusionsStore.resetServicesSearchResult();
        exclusionsStore.setServicesSearchValue(value);
    };

    const onClear = () => {
        exclusionsStore.setServicesSearchValue('');
    };

    return (
        <Search
            placeholder={reactTranslator.getMessage('settings_exclusion_placeholder_search')}
            value={exclusionsStore.servicesSearchValue}
            onChange={onChange}
            onClear={onClear}
        />
    );
});
