import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { translator } from '../../../../../common/translator';
import { Input } from '../../../ui/Input';

export const Search = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const onChange = (value: string) => {
        exclusionsStore.setExclusionsSearchValue(value);
    };

    return (
        <div className="exclusions__search">
            <Input
                placeholder={translator.getMessage('settings_exclusion_search_website')}
                value={exclusionsStore.exclusionsSearchValue}
                onChange={onChange}
            />
        </div>
    );
});
