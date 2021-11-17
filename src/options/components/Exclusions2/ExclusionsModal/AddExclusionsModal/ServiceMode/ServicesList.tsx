import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ServiceCategory } from './ServiceCategory';

export const ServicesList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    console.log(exclusionsStore.preparedServicesData);

    const { categories } = exclusionsStore.preparedServicesData;

    return (
        <ul>
            {Object.values(categories).map((category) => {
                // FIXME remove ts-ignore
                // @ts-ignore
                return (<ServiceCategory key={category.id} category={category} />);
            })}
        </ul>
    );
});
