import React, { useContext } from 'react';
import classnames from 'classnames';

import './status-image.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const StatusImage = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        isConnected,
        exclusionStatus,
        isDisconnectedRetrying,
        isConnectingRetrying,
        isConnectingIdle,
    } = settingsStore;

    const statusClassName = classnames(
        'status-image',
        { 'status-image--enabled': isConnected },
        { 'status-image--connecting': isConnectingIdle || isDisconnectedRetrying },
        { 'status-image--exclusions-disable': exclusionStatus },
        { 'status-image--server-error': isDisconnectedRetrying || isConnectingRetrying }
    );

    return (
        <div className={statusClassName} />
    );
});

export default StatusImage;
