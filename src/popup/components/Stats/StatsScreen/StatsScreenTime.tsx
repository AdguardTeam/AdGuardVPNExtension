import React, { useEffect, useState } from 'react';

import { translator } from '../../../../common/translator';
import { formatDuration } from '../utils';
import { ONE_MINUTE_MS } from '../../../../common/constants';

import { type StatsScreenWithUsageProps } from './StatsScreen';

/**
 * Props for the {@link StatsScreenTime} component.
 */
export type StatsScreenTimeProps = Pick<StatsScreenWithUsageProps, 'usage'>;

/**
 * Component that renders the time usage for the stats screen.
 * Example: 'Connection to VPN - 1d 1h 1m'
 */
export function StatsScreenTime(props: StatsScreenTimeProps) {
    const { usage } = props;
    const { durationMs, connectionStartedTimestamp } = usage;

    const [liveDuration, setLiveDuration] = useState(0);

    useEffect(() => {
        if (typeof connectionStartedTimestamp !== 'number') {
            setLiveDuration(0);

            return () => {
                setLiveDuration(0);
            };
        }

        const calculateLiveDuration = () => {
            setLiveDuration(Date.now() - connectionStartedTimestamp);
        };

        // calculate initial live duration
        calculateLiveDuration();

        // update live duration every minute
        const intervalId = setInterval(calculateLiveDuration, ONE_MINUTE_MS);

        return () => {
            clearInterval(intervalId);
            setLiveDuration(0);
        };
    }, [connectionStartedTimestamp]);

    return (
        <>
            <div className="stats-screen__subtitle">
                {translator.getMessage('popup_stats_usage_time')}
            </div>
            <div className="stats-screen-time">
                <div className="stats-screen-time__title">
                    {translator.getMessage('popup_stats_connection_to_vpn')}
                </div>
                <div className="stats-screen-time__usage">
                    {formatDuration(durationMs + liveDuration)}
                </div>
            </div>
        </>
    );
}
