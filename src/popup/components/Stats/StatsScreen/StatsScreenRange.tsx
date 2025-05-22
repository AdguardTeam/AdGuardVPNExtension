import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry';
import { StatsRange } from '../../../../background/statistics/statisticsTypes';
import { Select } from '../../../../common/components/Select';
import { translator } from '../../../../common/translator';
import { Icon } from '../../ui/Icon';
import { rootStore } from '../../../stores';

import { type StatsScreenBaseProps } from './StatsScreen';

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

    const handleClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.PeriodStatsClick,
            TelemetryScreenName.StatsScreen,
        );
    };

    return (
        <Select
            titleIcon={<Icon icon="arrow-down" className="select__btn-icon stats-screen__select-icon" />}
            value={range}
            className="stats-screen__select stats-screen__select--range"
            options={[
                { value: StatsRange.Hours24, title: translator.getMessage('popup_stats_range_hours_24') },
                { value: StatsRange.Days7, title: translator.getMessage('popup_stats_range_days_7') },
                { value: StatsRange.Days30, title: translator.getMessage('popup_stats_range_days_30') },
                { value: StatsRange.AllTime, title: translator.getMessage('popup_stats_range_all_time') },
            ]}
            activeItemIcon={<Icon icon="tick" className="select__item-icon stats-screen__select-icon" />}
            onChange={onRangeChange}
            onClick={handleClick}
        />
    );
});
