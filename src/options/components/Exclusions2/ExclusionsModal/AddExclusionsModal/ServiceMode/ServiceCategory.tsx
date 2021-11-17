import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';

import { rootStore } from '../../../../../stores';
import { ServiceRow } from './ServiceRow';

// FIXME fix linter
// @ts-ignore
import s from './service-category.module.pcss';

// FIXME add props interface
// @ts-ignore
export const ServiceCategory = observer(({ category }) => {
    const { exclusionsStore } = useContext(rootStore);
    const { services } = exclusionsStore.preparedServicesData;

    const categoryServices = category.services.map((serviceId: string) => {
        return services[serviceId];
    });

    const handleClickOnCategory = () => {
        exclusionsStore.toggleCategoryVisibility(category.id);
    };

    const unfoldCategory = exclusionsStore.unfoldedServiceCategories
        .some((id) => id === category.id);

    const categoryServicesClassname = cn('categoryServices', {
        [s.show]: unfoldCategory,
        [s.hide]: !unfoldCategory,
    });

    return (
        <div className="category" onClick={handleClickOnCategory}>
            <div className="categoryTitle">
                {category.title}
            </div>
            <div className={categoryServicesClassname}>
                {
                    // FIXME remove ts-ignore
                    // @ts-ignore
                    categoryServices.map((service) => {
                        return (<ServiceRow key={service.serviceId} service={service} />);
                    })
                }
            </div>
        </div>
    );
});
