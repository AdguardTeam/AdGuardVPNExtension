import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { ServiceRow } from './ServiceRow';
import { rootStore } from '../../../../../stores';
import { PreparedServiceCategory } from '../../../../../stores/ExclusionsStore';

// @ts-ignore
import s from './service-category.module.pcss';

export interface ServiceCategoryProps {
    category: PreparedServiceCategory;
}

export const ServiceCategory = observer(({
    category,
}: ServiceCategoryProps) => {
    const { exclusionsStore } = useContext(rootStore);

    const filteredServices = exclusionsStore.getFilteredServicesForCategory(category);

    const handleClickOnCategory = () => {
        exclusionsStore.toggleCategoryVisibility(category.id);
    };

    const unfoldCategory = exclusionsStore.unfoldAllServiceCategories
        || exclusionsStore.unfoldedServiceCategories.some((id) => id === category.id);

    const categoryClassname = cn('category', {
        category__unfolded: unfoldCategory,
        category__folded: !unfoldCategory,
    });

    const categoryServicesClassname = cn('category__services', {
        [s.show]: unfoldCategory,
        [s.hide]: !unfoldCategory,
    });

    if (filteredServices.length === 0) {
        return null;
    }

    return (
        <div className={categoryClassname}>
            <div className="category__title" onClick={handleClickOnCategory}>
                {category.name}
            </div>
            <div className={categoryServicesClassname}>
                {
                    filteredServices.map((service) => {
                        return (<ServiceRow key={service.serviceId} service={service} />);
                    })
                }
            </div>
        </div>
    );
});
