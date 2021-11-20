import React, { useContext } from 'react';
import { observer } from 'mobx-react';

// FIXME setup linter
// @ts-ignore
import './service-mode.pcss';
import { rootStore } from '../../../../../stores';

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

    return (
        <div className="service-row">
            <img className="service-row__icon" src={service.iconUrl} alt={service.serviceName} />
            <div className="service-row__title">{service.serviceName}</div>
            <div className="service-row__actions">
                <button
                    type="button"
                    className="simple-button"
                    onClick={addService}
                >
                    Add
                </button>
            </div>
        </div>
    );
});
