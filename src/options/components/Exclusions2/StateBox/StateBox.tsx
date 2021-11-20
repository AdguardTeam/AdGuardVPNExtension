import React from 'react';

import { STATE } from '../../../../common/exclusionsConstants';

import './statebox.pcss';

export const StateBox = ({
    id,
    type,
    state,
    toggleHandler,
}) => {
    const getStateIcon = () => {
        if (state === STATE.Enabled || state === true) {
            return '#enabled';
        }
        if (state === STATE.PartlyEnabled) {
            return '#partly-enabled';
        }
        return '#disabled';
    };

    return (
        <button
            className="statebox"
            type="button"
            onClick={toggleHandler(id, type)}
        >
            <svg className="statebox__icon">
                <use xlinkHref={getStateIcon()} />
            </svg>
        </button>
    );
};
