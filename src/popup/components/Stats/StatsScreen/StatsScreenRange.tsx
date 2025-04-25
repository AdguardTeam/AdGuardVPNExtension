import React from 'react';

import { Select } from '../../../../common/components/Select';
import { Icon } from '../../ui/Icon';
import { translator } from '../../../../common/translator';
import { StatsRange } from '../../../stores/StatsStore';

import { type StatsScreenProps } from './StatsScreen';

/**
 * Props for the StatsScreenRange component.
 */
export type StatsScreenRangeProps = Pick<StatsScreenProps, 'range' | 'onRangeChange'>;

/**
 * StatsScreenRange component.
 */
export function StatsScreenRange(props: StatsScreenRangeProps) {
    const { range, onRangeChange } = props;

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
        />
    );
}
