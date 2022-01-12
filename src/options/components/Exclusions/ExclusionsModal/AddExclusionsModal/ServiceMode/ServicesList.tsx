import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ServiceCategory } from './ServiceCategory';
import { reactTranslator } from '../../../../../../common/reactTranslator';

export const ServicesList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const { categories } = exclusionsStore.preparedServicesData;

    if (!Object.keys(categories).length) {
        return (
            <div className="services-list__connection-problem">
                {reactTranslator.getMessage('settings_exclusion_connection_problem')}
            </div>
        );
    }

    if (exclusionsStore.isServicesSearchEmpty) {
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
                    />
                );
            })}
        </ul>
    );
});
