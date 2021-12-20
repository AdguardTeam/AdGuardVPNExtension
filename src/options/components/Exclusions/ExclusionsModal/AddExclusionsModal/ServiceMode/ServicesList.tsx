import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ServiceCategory } from './ServiceCategory';
import { reactTranslator } from '../../../../../../common/reactTranslator';

export const ServicesList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const { categories } = exclusionsStore.preparedServicesData;

    const [emptySearch, setEmptySearch] = useState(false);

    const emptySearchHandler = (value: boolean) => {
        setEmptySearch(value);
    };

    if (exclusionsStore.servicesSearchValue && emptySearch) {
        return (
            <div className="search__nothing-found">
                {reactTranslator.getMessage('settings_exclusion_nothing_found')}
            </div>
        );
    }

    return (
        <ul className="services-list">
            {Object.values(categories).map((category) => {
                return (
                    <ServiceCategory
                        key={category.id}
                        category={category}
                        emptySearchHandler={emptySearchHandler}
                    />
                );
            })}
        </ul>
    );
});
