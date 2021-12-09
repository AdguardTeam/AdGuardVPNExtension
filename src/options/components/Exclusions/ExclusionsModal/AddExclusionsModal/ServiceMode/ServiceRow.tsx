import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ExclusionStates } from '../../../../../../common/exclusionsConstants';
import { SearchHighlighter } from '../../../Search/SearchHighlighter';
import { reactTranslator } from '../../../../../../common/reactTranslator';
import { Service, ServiceInterface } from '../../../../../../background/exclusions/services/Service';

import './service-mode.pcss';

/**
 * Returns true if service can be added, and returns false if service can be removed
 * @param service
 * @param servicesToToggle
 */
export const canAddService = (service: ServiceInterface, servicesToToggle: string[]) => {
    const isInToggle = servicesToToggle.some((serviceId) => serviceId === service.serviceId);

    if (isInToggle) {
        return service.state !== ExclusionStates.Disabled;
    }

    return service.state === ExclusionStates.Disabled;
};

interface ServiceRowProps {
    service: Service;
}

export const ServiceRow = observer(({ service }: ServiceRowProps) => {
    const { exclusionsStore } = useContext(rootStore);

    const addService = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        exclusionsStore.addToServicesToToggle(service.serviceId);
    };

    const removeService = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        exclusionsStore.addToServicesToToggle(service.serviceId);
    };

    const buttonsMap = {
        add: () => (
            <button
                type="button"
                className="simple-button"
                onClick={addService}
            >
                {reactTranslator.getMessage('settings_exclusion_add')}
            </button>
        ),
        remove: () => (
            <button
                type="button"
                className="simple-button service-row__actions__remove"
                onClick={removeService}
            >
                {reactTranslator.getMessage('settings_exclusion_modal_remove')}
            </button>
        ),
    };

    const serviceCanBeAdded = canAddService(service, exclusionsStore.servicesToToggle);

    const actionButton = serviceCanBeAdded ? buttonsMap.add() : buttonsMap.remove();

    return (
        <div className="service-row">
            <img className="service-row__icon" src={service.iconUrl} alt={service.serviceName} />
            <div className="service-row__title">
                <SearchHighlighter
                    value={service.serviceName}
                    search={exclusionsStore.servicesSearchValue}
                />
            </div>
            <div className="service-row__actions">
                {actionButton}
            </div>
        </div>
    );
});
