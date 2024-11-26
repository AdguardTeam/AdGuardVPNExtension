import React from 'react';

import classNames from 'classnames';

import { type ComputedServiceCategory, type ComputedService } from '../../../../../stores/ExclusionsStore';
import { Icon } from '../../../../ui/Icon';

export interface ServiceModeCategoryProps {
    category: ComputedServiceCategory;
    children: (service: ComputedService) => React.ReactNode;
    onCategoryClick: (categoryId: string) => void;
}

export function ServiceModeCategory({
    category,
    children,
    onCategoryClick,
}: ServiceModeCategoryProps) {
    const handleClickOnCategory = () => {
        onCategoryClick(category.id);
    };

    if (category.services.length === 0) {
        return null;
    }

    return (
        <div
            className={classNames(
                'service-mode-category',
                category.active && 'service-mode-category--active',
            )}
        >
            <button
                className="service-mode-category__btn"
                type="button"
                onClick={handleClickOnCategory}
            >
                <Icon name="arrow-down" className="service-mode-category__btn-icon" />
                {category.name}
            </button>
            <div className="service-mode-category__services">
                {category.services.map(children)}
            </div>
        </div>
    );
}
