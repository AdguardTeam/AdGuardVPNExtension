import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { rootStore } from '../../../../../stores';
import { type PreparedServiceCategory } from '../../../../../stores/ExclusionsStore';
import { containsIgnoreCase } from '../../../../../../common/components/SearchHighlighter/helpers';
import { Icon } from '../../../../ui/Icon';

import { ServiceRow } from './ServiceRow';

export interface ServiceCategoryProps {
    category: PreparedServiceCategory;
}

export const ServiceCategory = observer(({
    category,
}: ServiceCategoryProps) => {
    const { exclusionsStore } = useContext(rootStore);
    const { services } = exclusionsStore.preparedServicesData;

    const categoryServices = category.services
        .map((serviceId: string) => services[serviceId]);

    const filteredServices = categoryServices.filter((service) => {
        if (exclusionsStore.servicesSearchValue.length === 0) {
            return true;
        }

        return containsIgnoreCase(service.serviceName, exclusionsStore.servicesSearchValue);
    });

    const handleClickOnCategory = () => {
        exclusionsStore.toggleCategoryVisibility(category.id);
    };

    const unfoldCategory = exclusionsStore.unfoldAllServiceCategories
        || exclusionsStore.unfoldedServiceCategories.some((id) => id === category.id);

    const categoryClassname = cn(
        'service-mode-category',
        unfoldCategory && 'service-mode-category--active',
    );

    if (filteredServices.length === 0) {
        return null;
    }

    return (
        <div className={categoryClassname}>
            <button
                className="service-mode-category__btn has-tab-focus"
                type="button"
                onClick={handleClickOnCategory}
            >
                <Icon name="arrow-down" className="service-mode-category__btn-icon" />
                <span className="text-ellipsis">
                    {category.name}
                </span>
            </button>
            <div className="service-mode-category__services">
                {filteredServices.map((service) => {
                    return (<ServiceRow key={service.serviceId} service={service} />);
                })}
            </div>
        </div>
    );
});
