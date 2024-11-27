import React from 'react';

import classNames from 'classnames';

import { type ComputedService } from '../../../../../stores/ExclusionsStore';
import { reactTranslator } from '../../../../../../common/reactTranslator';
import { SearchHighlighter } from '../../Search';

export interface ServiceModeItemProps {
    service: ComputedService;
    searchValue: string;
    onServiceClick: (serviceId: string) => void;
}

export function ServiceModeItem({
    service,
    searchValue,
    onServiceClick,
}: ServiceModeItemProps) {
    const actionText = service.active
        ? reactTranslator.getMessage('settings_exclusion_modal_remove')
        : reactTranslator.getMessage('settings_exclusion_add');

    const handleClick = () => {
        onServiceClick(service.serviceId);
    };

    return (
        <button
            type="button"
            className={classNames(
                'service-mode-item',
                service.active && 'service-mode-item--active',
            )}
            onClick={handleClick}
        >
            <img
                className="service-mode-item__img"
                src={service.iconUrl}
                alt={service.serviceName}
            />
            <div className="service-mode-item__title">
                <SearchHighlighter
                    value={service.serviceName}
                    search={searchValue}
                />
            </div>
            <div className="service-mode-item__action">
                {actionText}
            </div>
        </button>
    );
}
