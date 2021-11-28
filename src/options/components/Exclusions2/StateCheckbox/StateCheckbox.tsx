import React from 'react';

import { STATE, TYPE } from '../../../../common/exclusionsConstants';

import './statecheckbox.pcss';

interface StateCheckboxProps {
    id: string,
    type: TYPE,
    state: STATE | boolean,
    toggleHandler: (id: string, type: TYPE) => React.MouseEventHandler<HTMLButtonElement>,
}

export var StateCheckbox = function ({
    id,
    type,
    state,
    toggleHandler,
}: StateCheckboxProps) {
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
            className="state-checkbox"
            type="button"
            onClick={toggleHandler(id, type)}
        >
            <svg className="state-checkbox__icon">
                <use xlinkHref={getStateIcon()} />
            </svg>
        </button>
    );
};
