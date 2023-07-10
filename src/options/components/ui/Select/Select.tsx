import React, { useState, useEffect, useRef } from 'react';
import { useOutsideClick } from '../useOutsideClick';

import './select.pcss';

type SelectProps<T> = {
    currentValue: T,
    options: {
        id: T,
        title: React.ReactNode | string,
        desc?: React.ReactNode | string,
    }[],
    optionChange: (id: T) => void,
};

export const Select = <T extends string>(props: SelectProps<T>) => {
    const {
        currentValue,
        options,
        optionChange,
    } = props;

    const [value, setValue] = useState(currentValue);
    const [hidden, setHidden] = useState(true);

    const ref = useRef<HTMLDivElement>(null);

    useOutsideClick(ref, () => setHidden(true));

    useEffect(() => {
        setValue(currentValue);
    });

    const handleSelectClick = (event: React.MouseEvent): void => {
        event.stopPropagation();
        setHidden(!hidden);
    };

    const handleOptionClick = (id: T): void => {
        setValue(id);
        optionChange(id);
        setHidden(true);
    };

    const isActiveOption = (id: T) => ((id === value) ? ' active' : '');

    const optionsList: React.RefObject<HTMLDivElement> = useRef(null);

    useEffect(() => {
        if (optionsList.current) {
            optionsList.current.scrollTop = 0;
        }
    });

    const getTitle = (value: T) => {
        const option = options.find((op) => op.id === value);
        return option?.title;
    };

    return (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <div className="selector" ref={ref}>
            <button
                className="selector__value"
                onClick={handleSelectClick}
                type="button"
            >
                <div className="selector__value-title">{getTitle(value)}</div>
            </button>
            <div
                className="selector__options-list"
                hidden={hidden}
                ref={optionsList}
            >
                {options.map(({ id, title, desc }) => (
                    <button
                        key={id}
                        className={`selector__option-item${isActiveOption(id)}`}
                        onClick={() => handleOptionClick(id)}
                        type="button"
                    >
                        <div className="selector__option-item-title">{title}</div>
                        {desc && (
                            <div className="selector__option-item-desc">{desc}</div>)}
                    </button>
                ))}
            </div>
        </div>
    );
};
