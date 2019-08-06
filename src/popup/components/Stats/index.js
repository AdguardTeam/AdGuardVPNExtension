import React, { Component } from 'react';
import { observer } from 'mobx-react';
import settingsStore from '../../stores/settingsStore';

@observer
class Stats extends Component {
    async componentDidMount() {
        await settingsStore.getProxyStats();
    }

    render() {
        if (!settingsStore.proxyStats) {
            return '';
        }

        const { speed, bandwidth } = settingsStore.proxyStats;
        return (
            <div className="stats">
                <div className="bandwidth">
                    <div className="value">
                        {speed}
                    </div>
                    <div className="units">
                        Bandwidth, Mb
                    </div>
                </div>
                <div className="speed">
                    <div className="value">
                        {bandwidth}
                    </div>
                    <div className="units">
                        Speed, Mbps
                    </div>
                </div>
            </div>
        );
    }
}

export default Stats;
