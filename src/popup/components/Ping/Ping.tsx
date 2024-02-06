import React from 'react';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import './ping.pcss';

type PingProps = {
    /**
     * Ping number in milliseconds.
     */
    ping: number;

    /**
     * Flag to indicate it is a ping for connected endpoint.
     */
    selected?: boolean;
};

const PING_WITH_WARNING = 150;

export const Ping = observer(({ ping, selected }: PingProps) => {
    if (!ping) {
        return null;
    }

    const pingClassName = classnames(
        'ping',
        {
            'ping--warning': ping >= PING_WITH_WARNING,
            'ping--success': ping < PING_WITH_WARNING,
            'ping--selected': selected,
        },
    );

    return (
        <div className={pingClassName}>
            {`${ping} ms`}
        </div>
    );
});
