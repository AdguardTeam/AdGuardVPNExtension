import React from 'react';

import { ExclusionStates } from '../../../../common/exclusionsConstants';

import './statecheckbox.pcss';

interface StateCheckboxProps {
    id: string,
    state: ExclusionStates,
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
        if (state === ExclusionStates.Enabled) {
            return '#enabled';
        }
        if (state === ExclusionStates.PartlyEnabled) {
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
