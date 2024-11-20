import React from 'react';

export interface RateStarProps {
    value: number;
    onChange: (value: number) => void;
}

export function RateStar({ value, onChange }: RateStarProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                className="rate__star"
            />
        </>
    );
}
