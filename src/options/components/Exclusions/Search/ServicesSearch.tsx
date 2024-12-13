import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { Input } from '../../ui/Input';

export const ServicesSearch = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const onChange = (value: string) => {
        exclusionsStore.setServicesSearchValue(value);
    };

    return (
        <Input
            placeholder={translator.getMessage('settings_exclusion_search_website')}
            value={exclusionsStore.exclusionsSearchValue}
            onChange={onChange}
        />
    );
});
