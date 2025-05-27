import React from 'react';

import { translator } from '../../../../common/translator';
import { formatDuration } from '../utils';

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
    const { durationMs } = usage;

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
                    {formatDuration(durationMs)}
                </div>
            </div>
        </>
    );
}
