import React, { useState, useEffect, useRef } from 'react';
import { ESC_KEY_NAME } from '../../../stores/consts';

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

    const outsideClickHandler = () => {
        setHidden(true);
    };

    const escKeyHandler = (e: KeyboardEvent) => {
        if (e.key === ESC_KEY_NAME) {
            setHidden(true);
            document.removeEventListener('click', outsideClickHandler);
        }
    };

    useEffect(() => {
        setValue(currentValue);
    });

    const handleSelectClick = (): void => {
        if (hidden) {
            setHidden(false);
            document.addEventListener('click', outsideClickHandler, { once: true });
            document.addEventListener('keydown', escKeyHandler, { once: true });
        }
    };

    useEffect(() => {
        if (hidden) {
            document.removeEventListener('keydown', escKeyHandler);
        }
    }, [hidden]);

    const handleOptionClick = (id: T): void => {
        setValue(id);
        optionChange(id);
    };

    const isActiveOption = (id: T) => ((id === value) ? ' active' : '');

    const optionsList: React.RefObject<HTMLUListElement> = useRef(null);

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
        <div className="selector">
            <div
                className="selector__value"
                onClick={handleSelectClick}
            >
                <div className="selector__value-title">{getTitle(value)}</div>
            </div>
            <ul
                className="selector__options-list"
                hidden={hidden}
                ref={optionsList}
            >
                {options.map(({ id, title, desc }) => (
                    <li
                        key={id}
                        className={`selector__option-item${isActiveOption(id)}`}
                        onClick={() => handleOptionClick(id)}
                    >
                        <div className="selector__option-item-title">{title}</div>
                        {desc && (
                            <div className="selector__option-item-desc">{desc}</div>)}
                    </li>
                ))}
            </ul>
        </div>
    );
};
