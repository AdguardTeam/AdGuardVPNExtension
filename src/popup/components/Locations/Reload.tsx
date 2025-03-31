import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { rootStore } from '../../stores';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry';

/**
 * Button component for pings recalculation.
 */
export const Reload = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const { arePingsRecalculating } = settingsStore;

    /**
     * Recalculates pings for all endpoints.
     */
    const recalculatePings = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.RenewLocationsClick,
            TelemetryScreenName.LocationsScreen,
        );
        await settingsStore.recalculatePings();
    };

    const btnClass = cn(
        'button',
        'endpoints__reload-btn',
        { 'endpoints__reload-btn--active': arePingsRecalculating },
    );

    const iconClass = cn(
        'icon',
        'endpoints__reload-icon',
        { 'endpoints__reload-icon--active': arePingsRecalculating },
    );

    return (
        <button
            type="button"
            className={btnClass}
            onClick={recalculatePings}
        >
            <svg className={iconClass}>
                <use xlinkHref="#reload" />
            </svg>
        </button>
    );
});
