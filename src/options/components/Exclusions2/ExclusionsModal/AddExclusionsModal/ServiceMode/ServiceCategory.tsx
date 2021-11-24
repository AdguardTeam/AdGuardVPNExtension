import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../../../../stores';
import { ServiceRow } from './ServiceRow';

// FIXME fix linter
// @ts-ignore
import s from './service-category.module.pcss';
import { containsIgnoreCase } from '../../../Search/SearchHighlighter/helpers';

// FIXME add props interface
// @ts-ignore
export const ServiceCategory = observer(({ category }) => {
    const { exclusionsStore } = useContext(rootStore);
    const { services } = exclusionsStore.preparedServicesData;

    const categoryServices = category.services.map((serviceId: string) => {
        return services[serviceId];
    });

    // FIXME remove @ts-ignore
    // @ts-ignore
    const filteredServices = categoryServices.filter((service) => {
        if (exclusionsStore.servicesSearchValue.length === 0) {
            return true;
        }

        // FIXME find out how should work search
        //  1. we should hide all categories?
        //  2. we should unwrap all categories?
        return containsIgnoreCase(service.serviceName, exclusionsStore.servicesSearchValue);
    });

    const handleClickOnCategory = () => {
        exclusionsStore.toggleCategoryVisibility(category.id);
    };

    const unfoldCategory = exclusionsStore.unfoldedServiceCategories
        .some((id) => id === category.id);

    const categoryClassname = cn('category', {
        category__unfolded: unfoldCategory,
        category__folded: !unfoldCategory,
    });

    const categoryServicesClassname = cn('category__services', {
        [s.show]: unfoldCategory,
        [s.hide]: !unfoldCategory,
    });

    return (
        <div className={categoryClassname}>
            <div className="category__title" onClick={handleClickOnCategory}>
                {/* TODO Add localization for categories */}
                {category.title}
            </div>
            <div className={categoryServicesClassname}>
                {
                    // FIXME remove ts-ignore
                    // @ts-ignore
                    filteredServices.map((service) => {
                        return (<ServiceRow key={service.serviceId} service={service} />);
                    })
                }
            </div>
        </div>
    );
});
