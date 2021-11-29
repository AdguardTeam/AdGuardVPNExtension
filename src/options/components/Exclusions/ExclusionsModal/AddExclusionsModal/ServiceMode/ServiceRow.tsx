import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { ExclusionStates } from '../../../../../../common/exclusionsConstants';
import { SearchHighlighter } from '../../../Search/SearchHighlighter';
import { reactTranslator } from '../../../../../../common/reactTranslator';

import './service-mode.pcss';

// FIXME remove any
const determineButtonState = (service: any, servicesToToggle: string[]) => {
    const isInToggle = servicesToToggle.some((serviceId: any) => serviceId === service.serviceId);

    if (isInToggle) {
        return service.state !== ExclusionStates.Disabled;
    }

    return service.state === ExclusionStates.Disabled;
};

// FIXME remove ts-ignore
// @ts-ignore
export const ServiceRow = observer(({ service }) => {
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

    const shouldAddService = determineButtonState(service, exclusionsStore.servicesToToggle);

    const actionButton = shouldAddService ? buttonsMap.remove() : buttonsMap.add();

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
