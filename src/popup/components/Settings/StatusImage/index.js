import React, { useContext } from 'react';
import classnames from 'classnames';

import './status-image.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';
import EnabledStatusAnimation from '../../Animations';

const StatusImage = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        isConnected,
        displayExclusionScreen,
        isDisconnectedRetrying,
        isConnectingRetrying,
        isConnectingIdle,
        canBeExcluded,
    } = settingsStore;

    const statusClassName = classnames(
        'status-image',
        { 'status-image--enabled': isConnected },
        { 'status-image--connecting': isConnectingIdle || isDisconnectedRetrying },
        { 'status-image--exclusions-disable': displayExclusionScreen && canBeExcluded },
        { 'status-image--server-error': isDisconnectedRetrying || isConnectingRetrying }
    );

    if (isConnected) {
        return (
            <div className={statusClassName}>
                <EnabledStatusAnimation />
            </div>
        );
    }

    return (
        <div className={statusClassName} />
    );
});

export default StatusImage;
