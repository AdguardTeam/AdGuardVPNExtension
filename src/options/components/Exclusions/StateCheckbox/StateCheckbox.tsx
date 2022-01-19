import React from 'react';

import { ExclusionState } from '../../../../common/exclusionsConstants';

import './statecheckbox.pcss';

interface StateCheckboxProps {
    state: ExclusionState,
    toggleHandler: () => void,
}

const getStateIcon = (state: ExclusionState) => {
    if (state === ExclusionState.Enabled) {
        return '#enabled';
    }
    if (state === ExclusionState.PartlyEnabled) {
        return '#partly-enabled';
    }
    return '#disabled';
};

export const StateCheckbox = ({
    state,
    toggleHandler,
}: StateCheckboxProps) => {
    return (
        <button
            className="state-checkbox"
            type="button"
            onClick={toggleHandler}
        >
            <svg className="state-checkbox__icon">
                <use xlinkHref={getStateIcon(state)} />
            </svg>
        </button>
    );
};
