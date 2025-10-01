import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import {
    TelemetryActionName,
    TelemetryScreenName,
    type StatsRangeClickActionNames,
} from '../../../../background/telemetry/telemetryEnums';
import { StatisticsRange } from '../../../../background/statistics/statisticsTypes';
import { Select } from '../../../../common/components/Select';
import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';

import { type StatsScreenBaseProps } from './StatsScreen';

/**
 * Range to telemetry action mapping.
 */
const RANGE_TO_ACTION_MAP: Record<StatisticsRange, StatsRangeClickActionNames> = {
    [StatisticsRange.Hours24]: TelemetryActionName.DayStatsClick,
    [StatisticsRange.Days7]: TelemetryActionName.WeekStatsClick,
    [StatisticsRange.Days30]: TelemetryActionName.MonthStatsClick,
    [StatisticsRange.AllTime]: TelemetryActionName.AllTimeStatsClick,
};

/**
 * Props for the {@link StatsScreenRange} component.
 */
export type StatsScreenRangeProps = Pick<StatsScreenBaseProps, 'range' | 'onRangeChange'>;

/**
 * Component that renders the range select for the stats screen.
 */
export const StatsScreenRange = observer((props: StatsScreenRangeProps) => {
    const { range, onRangeChange } = props;
    const { telemetryStore } = useContext(rootStore);

    const handleClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.PeriodStatsClick,
            TelemetryScreenName.ContextBasedScreen,
        );
    };

    const handleRangeChange = (value: StatisticsRange): void => {
        onRangeChange(value);
        telemetryStore.sendCustomEvent(
            RANGE_TO_ACTION_MAP[value],
            TelemetryScreenName.ContextBasedScreen,
        );
    };

    return (
        <Select
            value={range}
            className="stats-screen__select stats-screen__select--range"
            options={[
                { value: StatisticsRange.Hours24, title: translator.getMessage('popup_stats_range_hours_24') },
                { value: StatisticsRange.Days7, title: translator.getMessage('popup_stats_range_days_7') },
                { value: StatisticsRange.Days30, title: translator.getMessage('popup_stats_range_days_30') },
                { value: StatisticsRange.AllTime, title: translator.getMessage('popup_stats_range_all_time') },
            ]}
            onChange={handleRangeChange}
            onClick={handleClick}
        />
    );
});
