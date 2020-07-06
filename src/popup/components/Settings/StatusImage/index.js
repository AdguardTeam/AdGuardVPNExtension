import React, { useContext } from 'react';
import classnames from 'classnames';

import './status-image.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const StatusImage = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const statusClassName = classnames(
        'status-image',
        { 'status-image--enabled': settingsStore.isConnected },
        { 'status-image--server-error': settingsStore.isDisconnectedRetrying }
    );

    return (
        <div className={statusClassName} />
    );
});

export default StatusImage;
