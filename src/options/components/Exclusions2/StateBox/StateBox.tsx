import React from 'react';

import { STATE, TYPE } from '../../../../common/exclusionsConstants';

import './statebox.pcss';

interface StateBoxProps {
    id: string,
    type: TYPE,
    state: STATE | boolean,
    toggleHandler: (id: string, type: TYPE) => React.MouseEventHandler<HTMLButtonElement>,
}

export const StateBox = ({
    id,
    type,
    state,
    toggleHandler,
}: StateBoxProps) => {
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
