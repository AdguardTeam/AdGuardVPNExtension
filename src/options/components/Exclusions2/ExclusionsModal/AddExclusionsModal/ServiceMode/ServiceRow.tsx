import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../../stores';
import { TYPE } from '../../../../../../common/exclusionsConstants';

import './service-mode.pcss';

// FIXME remove ts-ignore
// @ts-ignore
export const ServiceRow = observer(({ service }) => {
    const { exclusionsStore } = useContext(rootStore);

    // @ts-ignore
    const addService = async (e) => {
        e.preventDefault();
        await exclusionsStore.addService(service.serviceId);
        exclusionsStore.closeAddExclusionModal();
    };

    // @ts-ignore
    const removeService = async (e) => {
        e.preventDefault();
        await exclusionsStore.removeExclusion(service.serviceId, TYPE.SERVICE);
        exclusionsStore.closeAddExclusionModal();
    };

    const renderActions = () => {
        const addButton = (
            <button
                type="button"
                className="simple-button"
                onClick={addService}
            >
                Add
            </button>
        );

        const removeButton = (
            <button
                type="button"
                className="simple-button service-row__actions__remove"
                onClick={removeService}
            >
                Remove
            </button>
        );

        return service.excluded ? removeButton : addButton;
    };

    return (
        <div className="service-row">
            <img className="service-row__icon" src={service.iconUrl} alt={service.serviceName} />
            <div className="service-row__title">{service.serviceName}</div>
            <div className="service-row__actions">
                {renderActions()}
            </div>
        </div>
    );
});
