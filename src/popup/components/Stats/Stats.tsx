import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { StatsRange } from '../../stores/StatsStore';

import { StatsScreen } from './StatsScreen';

export const Stats = observer(() => {
    const { statsStore } = useContext(rootStore);
    const {
        shouldRenderStatsScreen,
        totalUsageData,
        closeStatsScreen,
    } = statsStore;

    // FIXME: Implement range on store
    const [range, setRange] = React.useState<StatsRange>(StatsRange.Days7);

    const handleClear = () => {
        // FIXME: Implement
        // FIXME: Clarify is it clears based on current screen or all
    };

    if (!shouldRenderStatsScreen) {
        return null;
    }

    // FIXME: Implement all locations screen
    // FIXME: Implement location screen

    return (
        <StatsScreen
            title={translator.getMessage('popup_stats_for_browser_title')}
            range={range}
            shouldRenderWhySafe
            dataUsage={totalUsageData}
            onBackClick={closeStatsScreen}
            onClear={handleClear}
            onRangeChange={setRange}
        />
    );
});
