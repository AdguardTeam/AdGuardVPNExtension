import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { PING_WITH_WARNING } from '../../stores/consts';

import './ping.pcss';

export const Ping = ({ ping }: { ping: number }) => {
    if (!ping) {
        return null;
    }

    const pingClassName = classnames(
        'ping',
        { 'ping--warning': ping >= PING_WITH_WARNING },
        { 'ping--success': ping < PING_WITH_WARNING },
    );

    return (
        <div className={pingClassName}>
            {`${ping} ms`}
        </div>
    );
};

Ping.propTypes = {
    ping: PropTypes.number.isRequired,
};
