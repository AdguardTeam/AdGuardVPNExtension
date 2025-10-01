import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { rootStore } from '../../stores';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { Icon } from '../../../common/components/Icons';

/**
 * Button component for pings recalculation.
 */
export const Reload = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const { arePingsRecalculating } = settingsStore;

    /**
     * Recalculates pings for all endpoints.
     */
    const recalculatePings = async (): Promise<void> => {
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
        { 'endpoints__reload-icon--active': arePingsRecalculating },
    );

    return (
        <button
            type="button"
            className={btnClass}
            onClick={recalculatePings}
        >
            <Icon
                name="reload"
                color="product"
                className={iconClass}
            />
        </button>
    );
});
