import React from 'react';

import { type ComputedServiceCategory } from '../../../../../stores/ExclusionsStore';
import { reactTranslator } from '../../../../../../common/reactTranslator';
import { translator } from '../../../../../../common/translator';
import { Button } from '../../../../ui/Button';
import { Input } from '../../../../ui/Input';

import { ServiceModeList } from './ServiceModeList';
import { ServiceModeCategory } from './ServiceModeCategory';
import { ServiceModeItem } from './ServiceModeItem';

import './service-mode.pcss';

export interface ServiceModeProps {
    searchValue: string;
    searchEmpty: boolean;
    categories: ComputedServiceCategory[];
    selectedSize: number;
    onSearchChange: (searchValue: string) => void;
    onClose: () => void;
    onSubmit: () => void;
    onCategoryClick: (categoryId: string) => void;
    onServiceClick: (serviceId: string) => void;
}

export function ServiceMode({
    searchValue,
    searchEmpty,
    categories,
    selectedSize,
    onSearchChange,
    onClose,
    onSubmit,
    onCategoryClick,
    onServiceClick,
}: ServiceModeProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form
            className="service-mode"
            onSubmit={handleSubmit}
            onReset={onClose}
        >
            <div className="service-mode__search">
                <Input
                    value={searchValue}
                    placeholder={translator.getMessage('settings_exclusion_placeholder_search')}
                    onChange={onSearchChange}
                />
            </div>
            <ServiceModeList empty={categories.length === 0} searchEmpty={searchEmpty}>
                {categories.map((category) => (
                    <ServiceModeCategory
                        key={category.id}
                        category={category}
                        onCategoryClick={onCategoryClick}
                    >
                        {(service) => (
                            <ServiceModeItem
                                key={service.serviceId}
                                service={service}
                                searchValue={searchValue}
                                onServiceClick={onServiceClick}
                            />
                        )}
                    </ServiceModeCategory>
                ))}
            </ServiceModeList>
            <div className="exclusions__modal-actions">
                <Button type="reset" variant="outline">
                    {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                </Button>
                <Button type="submit" disabled={selectedSize === 0}>
                    {reactTranslator.getMessage('settings_exclusion_modal_save')}
                </Button>
            </div>
        </form>
    );
}
