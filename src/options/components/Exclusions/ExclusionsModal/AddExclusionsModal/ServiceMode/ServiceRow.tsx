import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { TelemetryActionName, TelemetryScreenName } from '../../../../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../../../../stores';
import { ExclusionState, type ServiceDto } from '../../../../../../common/exclusionsConstants';
import { SearchHighlighter } from '../../../../../../common/components/SearchHighlighter';
import { translator } from '../../../../../../common/translator';

/**
 * Checks if service can be added or removed.
 *
 * @param service
 * @param servicesToToggle
 *
 * @returns True if service can be added, and returns false if service can be removed.
 */
export const canAddService = (service: ServiceDto, servicesToToggle: string[]): boolean => {
    const isInToggle = servicesToToggle.some((serviceId) => serviceId === service.serviceId);

    if (isInToggle) {
        return service.state !== ExclusionState.Disabled;
    }

    return service.state === ExclusionState.Disabled;
};

interface ServiceRowProps {
    service: ServiceDto;
}

export const ServiceRow = observer(({ service }: ServiceRowProps) => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);

    const addService = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.AddWebsiteFromList,
            TelemetryScreenName.DialogAddWebsiteExclusion,
        );
        exclusionsStore.addToServicesToToggle(service.serviceId);
    };

    const removeService = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        exclusionsStore.addToServicesToToggle(service.serviceId);
    };

    const serviceCanBeAdded = canAddService(service, exclusionsStore.servicesToToggle);

    const classes = classNames(
        'service-mode-item has-tab-focus',
        !serviceCanBeAdded && 'service-mode-item--active',
    );

    const buttonText = serviceCanBeAdded
        ? translator.getMessage('settings_exclusion_add')
        : translator.getMessage('settings_exclusion_modal_remove');

    const clickHandler = serviceCanBeAdded ? addService : removeService;

    return (
        <button
            type="button"
            className={classes}
            onClick={clickHandler}
        >
            <img
                className="service-mode-item__img"
                src={service.iconUrl}
                alt={service.serviceName}
            />
            <div className="service-mode-item__title text-ellipsis">
                <SearchHighlighter
                    value={service.serviceName}
                    search={exclusionsStore.servicesSearchValue}
                />
            </div>
            <div className="service-mode-item__action">
                {buttonText}
            </div>
        </button>
    );
});
