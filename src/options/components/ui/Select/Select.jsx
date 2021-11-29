import React, { useState, useEffect, useRef } from 'react';
import './select.pcss';

export const Select = ((props) => {
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

    const closeOnClick = () => {
        document.addEventListener(
            'click',
            () => { setHidden(true); },
            { once: true },
        );
    };

    const handleSelectClick = () => {
        if (hidden) {
            setHidden(false);
            closeOnClick();
        }
    };

    const handleOptionClick = (id) => {
        setValue(id);
        optionChange(id);
    };

    const isActiveOption = (id) => ((id === value) ? ' active' : '');

    const optionsList = useRef(null);

    useEffect(() => {
        optionsList.current.scrollTop = 0;
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
