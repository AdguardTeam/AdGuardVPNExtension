import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { translator } from '../../../common/translator';
import { getForwarderUrl } from '../../../common/helpers';
import { rootStore } from '../../stores';

import { StatsScreen } from './StatsScreen';

export const Stats = observer(() => {
    const { statsStore, settingsStore } = useContext(rootStore);
    const {
        shouldRenderStatsScreen,
        range,
        totalUsageData,
        closeStatsScreen,
        setRange,
    } = statsStore;
    const { forwarderDomain } = settingsStore;

    const privacyPolicyUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.PRIVACY);

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
            privacyPolicyUrl={privacyPolicyUrl}
            dataUsage={totalUsageData}
            onBackClick={closeStatsScreen}
            onClear={handleClear}
            onRangeChange={setRange}
        />
    );
});
