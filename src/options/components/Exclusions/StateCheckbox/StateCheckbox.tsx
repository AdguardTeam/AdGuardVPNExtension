import React from 'react';

import { ExclusionState } from '../../../../common/exclusionsConstants';

import './statecheckbox.pcss';

interface StateCheckboxProps {
    id: string,
    state: ExclusionState,
    toggleHandler: (
        id: string,
    ) => React.MouseEventHandler<HTMLButtonElement>,
}

export const StateCheckbox = ({
    id,
    state,
    toggleHandler,
}: StateCheckboxProps) => {
    const getStateIcon = () => {
        if (state === ExclusionState.Enabled) {
            return '#enabled';
        }
        if (state === ExclusionState.PartlyEnabled) {
            return '#partly-enabled';
        }
        return '#disabled';
    };

    return (
        <button
            className="state-checkbox"
            type="button"
            onClick={toggleHandler(id)}
        >
            <svg className="state-checkbox__icon">
                <use xlinkHref={getStateIcon()} />
            </svg>
        </button>
    );
};
