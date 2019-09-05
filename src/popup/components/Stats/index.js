import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import './stats.pcss';

const Stats = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            await settingsStore.getProxyStats();
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    if (!settingsStore.proxyStats) {
        return '';
    }

    const { mbytesDownloaded, downloadSpeedMbytesPerSec } = settingsStore.proxyStats;
    return (
        <div className="stats">
            <div className="stats__col">
                <div className="stats__value">
                    {mbytesDownloaded}
                </div>
                <div className="stats__units">
                        Bandwidth, Mb
                </div>
            </div>
            <div className="stats__col">
                <div className="stats__value">
                    {downloadSpeedMbytesPerSec}
                </div>
                <div className="stats__units">
                        Speed, Mbps
                </div>
            </div>
        </div>
    );
});

export default Stats;
