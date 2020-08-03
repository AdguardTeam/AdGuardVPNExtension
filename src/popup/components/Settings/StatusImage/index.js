import React, { useContext } from 'react';
import classnames from 'classnames';

import './status-image.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const StatusImage = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        isExcluded,
        isConnected,
        exclusionsInverted,
        isDisconnectedRetrying,
        isConnectingRetrying,
    } = settingsStore;

    const statusClassName = classnames(
        'status-image',
        { 'status-image--enabled': isConnected },
        { 'status-image--exclusions-disable': (isExcluded && !exclusionsInverted) || (!isExcluded && exclusionsInverted) },
        { 'status-image--server-error': isDisconnectedRetrying || isConnectingRetrying }
    );

    return (
        <div className={statusClassName} />
    );
});

export default StatusImage;
