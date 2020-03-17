import React, { useEffect } from 'react';
import './select.pcss';

const Select = ((props) => {
    /**
     * Copy innerHTML and value from source element to target
     * @param {object} source
     * @param {object} target
     */
    const copyData = (source, target) => {
        if (source && target) {
            // eslint-disable-next-line no-param-reassign
            target.innerHTML = source.innerHTML;

            const sourceValue = source.getAttribute('value');
            // eslint-disable-next-line no-param-reassign
            target.setAttribute('value', sourceValue);
        }
    };

    /**
     * Updates select to actual data
     */
    const updateSelectorData = () => {
        const selector = document.querySelector('.selector__value');
        const value = selector.getAttribute('value');
        copyData(
            document.querySelector(`.selector__options-list > [value=${value}]`),
            selector
        );
    };

    useEffect(() => {
        updateSelectorData();
    });

    /**
     * Close element on document click
     * @param {object} element
     */
    const closeOnClick = (element) => {
        document.addEventListener(
            'click',
            // eslint-disable-next-line no-param-reassign
            () => { element.style.display = 'none'; },
            { once: true }
        );
    };

    const handleSelectClick = () => {
        const optionsList = document.querySelector('.selector__options-list');
        if (!optionsList.style.display || optionsList.style.display === 'none') {
            optionsList.style.display = 'block';
            closeOnClick(optionsList);
        }
    };

    const handleOptionClick = (id) => {
        copyData(
            document.querySelector(`.selector__options-list > [value=${id}]`),
            document.querySelector('.selector__value')
        );
        const { optionChange } = props;
        optionChange(id);
    };

    const {
        id,
        disabled,
        currentValue,
        options,
    } = props;

    return (
        <div
            id={id}
            className="selector"
            disabled={disabled}
        >
            <div
                className="selector__value"
                value={currentValue}
                onClick={handleSelectClick}
            />
            <ul className="selector__options-list">
                {options.map((option, i) => (
                    <li
                        value={option.id}
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        className="selector__option-item"
                        onClick={() => handleOptionClick(option.id)}
                    >
                        <div className="selector__option-item__title">{option.title}</div>
                        <div className="selector__option-item__desc">{option.desc}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
});

export default Select;
