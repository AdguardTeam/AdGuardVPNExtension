import React from 'react';
import classnames from 'classnames';

import './radio-button.pcss';

export const RadioButton = ({ enabled }: { enabled: boolean }) => {
    const radioButtonClassNames = classnames('radio-button', { enabled });
    return (
        <div className={radioButtonClassNames} />
    );
};
