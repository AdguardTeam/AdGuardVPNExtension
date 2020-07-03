import React from 'react';
import classnames from 'classnames';

import './status-image.pcss';

const StatusImage = ({ connected }) => {
    const statusClassName = classnames(
        'status-image',
        { 'status-image--enabled': connected }
    );

    return (
        <div className={statusClassName} />
    );
};

export default StatusImage;
