import React from 'react';
import './warning.pcss';

function Warning(props) {
    const {
        desc,
        mod,
    } = props;

    return (
        <div className={`warning warning--${mod}`}>
            {desc}
        </div>
    );
}

export default Warning;
