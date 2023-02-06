import React, { useContext } from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';

import './ping.pcss';

const PING_WITH_WARNING = 150;

export const Ping = observer(({ ping }: { ping: number }) => {
    const { settingsStore } = useContext(rootStore);
    const { isConnected } = settingsStore;

    if (!ping) {
        return null;
    }

    const pingClassName = classnames(
        'ping',
        {
            'ping--warning': ping >= PING_WITH_WARNING,
            'ping--success': ping < PING_WITH_WARNING,
            'ping--connected': isConnected,
        },
    );

    return (
        <div className={pingClassName}>
            {`${ping} ms`}
        </div>
    );
});
