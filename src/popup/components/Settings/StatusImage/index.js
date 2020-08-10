import React, { useContext } from 'react';
import classnames from 'classnames';

import './status-image.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const StatusImage = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        isConnected,
        displayExlusionScreen,
        isDisconnectedRetrying,
        isConnectingRetrying,
        isConnectingIdle,
        canBeExcluded,
    } = settingsStore;

    const statusClassName = classnames(
        'status-image',
        { 'status-image--enabled': isConnected },
        { 'status-image--connecting': isConnectingIdle || isDisconnectedRetrying },
        { 'status-image--exclusions-disable': displayExlusionScreen && canBeExcluded },
        { 'status-image--server-error': isDisconnectedRetrying || isConnectingRetrying }
    );

    return (
        <div className={statusClassName} />
    );
});

export default StatusImage;
