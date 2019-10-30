import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import './stats.pcss';

const Stats = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const updateStats = () => {
        const UPDATE_INTERVAL = 1000;
        // first time run immediately
        settingsStore.getProxyStats();

        // next time once per second
        const intervalId = setInterval(async () => {
            await settingsStore.getProxyStats();
        }, UPDATE_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    };

    useEffect(() => {
        return updateStats();
    }, []);

    const { bytesDownloaded, bytesUploaded } = settingsStore.stats;
    return (
        <div className="stats">
            <div className="stats__col">
                <div className="stats__value">
                    {bytesDownloaded.value}
                </div>
                <div className="stats__units">
                    Downloaded,
                    {' '}
                    {bytesDownloaded.unit}
                </div>
            </div>
            <div className="stats__col">
                <div className="stats__value">
                    {bytesUploaded.value}
                </div>
                <div className="stats__units">
                    Uploaded,
                    {' '}
                    {bytesUploaded.unit}
                </div>
            </div>
        </div>
    );
});

export default Stats;
