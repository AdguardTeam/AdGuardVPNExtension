import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { rootStore } from '../../stores';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { Icon } from '../../../common/components/Icons';

/**
 * Button component for refreshing locations from the server.
 */
export const Reload = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const { arePingsRecalculating } = settingsStore;

    /**
     * Fetches fresh locations from the server.
     */
    const refreshLocations = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.RenewLocationsClick,
            TelemetryScreenName.LocationsScreen,
        );
        await settingsStore.refreshLocations();
    };

    const btnClass = cn(
        'button',
        'endpoints__reload-btn',
        { 'endpoints__reload-btn--active': arePingsRecalculating },
    );

    const iconClass = cn(
        { 'endpoints__reload-icon--active': arePingsRecalculating },
    );

    return (
        <button
            type="button"
            className={btnClass}
            onClick={refreshLocations}
        >
            <Icon
                name="reload"
                color="product"
                className={iconClass}
            />
        </button>
    );
});
