import React, { type ReactElement } from 'react';

import { Icon } from '../../../../common/components/Icons';

export interface RateStarProps {
    value: number;
    onChange: (value: number) => void;
}

export function RateStar({ value, onChange }: RateStarProps): ReactElement {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { value } = e.target;
        const numberValue = parseInt(value, 10);
        if (!Number.isNaN(numberValue) && Number.isFinite(numberValue)) {
            onChange(numberValue);
        }
    };

    return (
        <>
            <input
                type="radio"
                value={value}
                name="rating"
                id={`rating-${value}`}
                className="rate__input"
                onChange={handleChange}
            />
            <label
                htmlFor={`rating-${value}`}
                className="rate__star has-tab-focus"
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                tabIndex={0}
            >
                <Icon name="star" size="30" />
            </label>
        </>
    );
}
