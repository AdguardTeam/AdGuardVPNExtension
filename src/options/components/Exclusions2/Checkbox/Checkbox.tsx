import React from 'react';

import { STATE } from '../../../../common/exclusionsConstants';

import './checkbox.pcss';

export const Checkbox = ({ id, state }) => {
    const renderStateIcon = () => {
        let stateIcon = '#partly-enabled';
        if (state === STATE.Enabled || state === true) {
            stateIcon = '#enabled';
        } else if (state === STATE.Disabled || state === false) {
            stateIcon = '#disabled';
        }
        return (
            <svg className="icon icon--support">
                <use xlinkHref={stateIcon} />
            </svg>
        );
    };

    return (
        <div className="checkbox">
            {renderStateIcon()}
        </div>
    );
};
