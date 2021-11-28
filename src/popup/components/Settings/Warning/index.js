import React from 'react';
import './warning.pcss';

const Warning = function (props) {
    const {
        desc,
        mod,
    } = props;

    return (
        <div className={`warning warning--${mod}`}>
            {desc}
        </div>
    );
};

export default Warning;
