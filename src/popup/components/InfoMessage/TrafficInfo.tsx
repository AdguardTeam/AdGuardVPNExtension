import { observer } from 'mobx-react';
import React, { useContext } from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { formatBytes } from '../../../lib/helpers';
import { rootStore } from '../../stores';

/**
 * TrafficInfo Component
 *
 * This component provides information related to the user's VPN traffic.
 * It displays a message when the traffic limit is exceeded. If not, it displays
 * the remaining traffic and the days left to traffic renewal.
 */
export const TrafficInfo = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);
    const { remainingTraffic } = vpnStore;
    const formattedRemainingTraffic = formatBytes(remainingTraffic);

    if (settingsStore.hasLimitExceededError) {
        return (
            <span>
                {reactTranslator.getMessage('popup_traffic_limit_reached')}
            </span>
        );
    }

    return (
        <>
            <div>
                {reactTranslator.getMessage('popup_free_traffic_info_left', {
                    value: formattedRemainingTraffic.value,
                    unit: formattedRemainingTraffic.unit,
                })}
            </div>
            <div>
                {reactTranslator.getPlural('popup_free_traffic_info_days_left', vpnStore.daysToTrafficRenewal, {
                    days: vpnStore.daysToTrafficRenewal,
                })}
            </div>
        </>
    );
});
