import React from 'react';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';

import './ping.pcss';


const Ping = ({ ping }) => {
    const pingClassName = classnames(
        'ping',
        { 'ping--warning': ping && ping >= PING_WITH_WARNING },
        { 'ping--success': ping && ping < PING_WITH_WARNING }
    );

    const renderSelectedLocationPing = () => {
        if (ping) {
            return `${ping} ms`;
        }

        return (
            <span className="endpoints__dots">
                <span className="endpoints__dot">.</span>
                <span className="endpoints__dot">.</span>
                <span className="endpoints__dot">.</span>
            </span>
        );
    };

    return (
        <div className={pingClassName}>
            {renderSelectedLocationPing()}
        </div>
    );
};

export default Ping;
