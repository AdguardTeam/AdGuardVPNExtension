import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import { formatBytes } from '../../../lib/helpers';

const WARNING_PERCENT = 50;
const DANGER_PERCENT = 25;

export const Stats = observer(() => {
    const { vpnStore } = useContext(rootStore);
    const { vpnInfo } = vpnStore;

    const usedDownloadedBytes = vpnInfo.usedDownloadedBytes || 0;
    const usedDownloadedData = formatBytes(usedDownloadedBytes);
    const downloadedTraffic = `↓ ${usedDownloadedData.value} ${usedDownloadedData.unit}`;

    const usedUploadedBytes = vpnInfo.usedUploadedBytes || 0;
    const usedUploadedData = formatBytes(usedUploadedBytes);
    const uploadedTraffic = `↑ ${usedUploadedData.value} ${usedUploadedData.unit}`;

    const downloadedClassnames = classnames('stats__downloaded', {
        'stats__downloaded--yellow': vpnStore.trafficUsingProgress < WARNING_PERCENT,
        'stats__downloaded--red': vpnStore.trafficUsingProgress < DANGER_PERCENT,
    });

    return (
        <div className="stats extra-options__item">
            <div className="stats__title">Stats</div>
            <span className={downloadedClassnames}>{downloadedTraffic}</span>
            <span className="stats__uploaded">{uploadedTraffic}</span>
        </div>
    );
});
