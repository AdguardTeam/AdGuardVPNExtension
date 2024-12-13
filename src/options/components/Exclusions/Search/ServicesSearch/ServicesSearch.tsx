import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Input } from '../../../ui/Input';

export const ServicesSearch = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const onChange = (value: string) => {
        exclusionsStore.setServicesSearchValue(value);
    };

    return (
        <div className="exclusions__search exclusions__search--services">
            <Input
                placeholder={translator.getMessage('settings_exclusion_placeholder_search')}
                value={exclusionsStore.servicesSearchValue}
                onChange={onChange}
            />
        </div>
    );
});
