import React, { useState, useEffect, useRef } from 'react';

import './select.pcss';

type SelectProps = {
    currentValue: string,
    options: {
        [key: string]: {
            title: React.ReactNode | string,
            desc?: React.ReactNode | string,
        },
    },
    optionChange: (id: string) => void,
};

export const Select = ((props: SelectProps) => {
    const {
        currentValue,
        options,
        optionChange,
    } = props;

    const [value, setValue] = useState(currentValue);
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        setValue(currentValue);
    });

    const closeOnClick = (): void => {
        document.addEventListener(
            'click',
            () => { setHidden(true); },
            { once: true },
        );
    };

    const handleSelectClick = (): void => {
        if (hidden) {
            setHidden(false);
            closeOnClick();
        }
    };

    const handleOptionClick = (id: string): void => {
        setValue(id);
        optionChange(id);
    };

    const isActiveOption = (id: string) => ((id === value) ? ' active' : '');

    const optionsList: React.RefObject<HTMLUListElement> = useRef(null);

    useEffect(() => {
        if (optionsList.current) {
            optionsList.current.scrollTop = 0;
        }
    });

    return (
        <div className="selector">
            <div
                className="selector__value"
                onClick={handleSelectClick}
            >
                <div className="selector__value-title">{options[value].title}</div>
            </div>
            <ul
                className="selector__options-list"
                hidden={hidden}
                ref={optionsList}
            >
                {Object.keys(options).map((id) => (
                    <li
                        key={id}
                        className={`selector__option-item${isActiveOption(id)}`}
                        onClick={() => handleOptionClick(id)}
                    >
                        <div className="selector__option-item-title">{options[id].title}</div>
                        {options[id].desc && (
                            <div className="selector__option-item-desc">{options[id].desc}</div>)}
                    </li>
                ))}
            </ul>
        </div>
    );
});
