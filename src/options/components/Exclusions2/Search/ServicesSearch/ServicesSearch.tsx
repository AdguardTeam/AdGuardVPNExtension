import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Search } from '../Search';
import { rootStore } from '../../../../stores';

export const ServicesSearch = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const onChange = (value: string) => {
        exclusionsStore.setServicesSearchValue(value);
    };

    const onClear = () => {
        exclusionsStore.setServicesSearchValue('');
    };

    return (
        <Search
            // FIXME add to translations
            placeholder="Search"
            value={exclusionsStore.servicesSearchValue}
            onChange={onChange}
            onClear={onClear}
        />
    );
});
