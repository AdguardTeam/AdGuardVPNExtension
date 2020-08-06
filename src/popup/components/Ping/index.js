import React from 'react';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';

import './ping.pcss';

const Ping = ({ ping }) => {
    // ping can be only Number
    const pingClassName = classnames(
        'ping',
        { 'ping--warning': ping && ping >= PING_WITH_WARNING },
        { 'ping--success': ping && ping < PING_WITH_WARNING }
    );

    const renderPing = () => {
        if (ping) {
            return `${ping} ms`;
        }
        return '';
    };

    return (
        <div className={pingClassName}>
            {renderPing()}
        </div>
    );
};

export default Ping;
