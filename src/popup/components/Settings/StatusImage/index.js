import React from 'react';
import classnames from 'classnames';

import './status-image.pcss';

const StatusImage = ({ enabled }) => {
    const statusClassName = classnames(
        'status-image',
        { 'status-image--enabled': enabled }
    );

    return (
        <div className={statusClassName} />
    );
};

export default StatusImage;
