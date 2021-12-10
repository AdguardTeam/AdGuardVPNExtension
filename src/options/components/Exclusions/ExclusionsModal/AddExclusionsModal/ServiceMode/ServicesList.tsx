import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ServiceCategory } from './ServiceCategory';

export const ServicesList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    console.log(exclusionsStore.preparedServicesData);
    const { categories } = exclusionsStore.preparedServicesData;

    return (
        <ul className="services-list">
            {Object.values(categories).map((category) => {
                return (<ServiceCategory key={category.id} category={category} />);
            })}
        </ul>
    );
});
