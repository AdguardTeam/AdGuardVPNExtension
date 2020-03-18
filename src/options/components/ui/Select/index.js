import React, { useState, useEffect } from 'react';
import './select.pcss';

const Select = ((props) => {
    const {
        disabled,
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
            { once: true }
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

    return (
        <div
            className="selector"
            disabled={disabled}
        >
            <div
                className="selector__value"
                value={value}
                onClick={handleSelectClick}
            >
                <div className="selector__value__title">{options[value].title}</div>
                <div className="selector__value__desc">{options[value].desc}</div>
            </div>
            <ul
                className="selector__options-list"
                hidden={hidden}
            >
                {Object.keys(options).map((id, i) => (
                    <li
                        value={id}
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        className="selector__option-item"
                        onClick={() => handleOptionClick(id)}
                    >
                        <div className="selector__option-item__title">{options[id].title}</div>
                        <div className="selector__option-item__desc">{options[id].desc}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
});

export default Select;
