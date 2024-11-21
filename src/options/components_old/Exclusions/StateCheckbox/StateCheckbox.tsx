import React from 'react';

import { ExclusionState } from '../../../../common/exclusionsConstants';

import './statecheckbox.pcss';

interface StateCheckboxProps {
    state: ExclusionState,
    toggleHandler: () => void,
    extraClassName?: string,
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
    extraClassName,
}: StateCheckboxProps) => {
    const btnClassNames = extraClassName
        ? `state-checkbox ${extraClassName}`
        : 'state-checkbox';
    return (
        <button
            className={btnClassNames}
            type="button"
            onClick={toggleHandler}
        >
            <svg className="state-checkbox__icon">
                <use xlinkHref={getStateIcon(state)} />
            </svg>
        </button>
    );
};
