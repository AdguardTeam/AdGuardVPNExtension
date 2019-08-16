import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import './stats.pcss';

const Stats = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useState(async () => {
        await settingsStore.getProxyStats();
    });


    if (!settingsStore.proxyStats) {
        return '';
    }

    const { speed, bandwidth } = settingsStore.proxyStats;
    return (
        <div className="stats">
            <div className="stats__col">
                <div className="stats__value">
                    {speed}
                </div>
                <div className="stats__units">
                        Bandwidth, Mb
                </div>
            </div>
            <div className="stats__col">
                <div className="stats__value">
                    {bandwidth}
                </div>
                <div className="stats__units">
                        Speed, Mbps
                </div>
            </div>
        </div>
    );
});

export default Stats;
