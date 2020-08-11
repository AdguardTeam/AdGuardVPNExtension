import React, { useState } from 'react';

import SubdomainsCheckbox from '../SubdomainCheckbox';

import './checkbox.pcss';

const Checkbox = ({
    id,
    label,
    checked,
    handleToggle,
    handleRename,
    handleRemove,
}) => {
    const [hostname, setHostname] = useState(label);
    const [isChanged, setIsChanged] = useState(false);

    const handleChange = (e) => {
        setIsChanged(hostname !== e.target.value);
        setHostname(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleRename(hostname);
        setIsChanged(false);
    };

    const handleBlur = (e) => {
        if (e.target.value.length <= 0) {
            handleRemove();
        }
    };

    return (
        <form className="form" onSubmit={handleSubmit}>
            <div className="checkbox checkbox--domain">
                <input
                    id={id}
                    name={id}
                    type="checkbox"
                    className="checkbox__input"
                    checked={checked}
                    onChange={handleToggle}
                />
                <label htmlFor={id} className="checkbox__label">
                    {checked ? (
                        <svg className="icon icon--button icon--checked">
                            <use xlinkHref="#checked" />
                        </svg>
                    ) : (
                        <svg className="icon icon--button icon--unchecked">
                            <use xlinkHref="#unchecked" />
                        </svg>
                    )}
                </label>
                <input
                    type="text"
                    name="hostname"
                    className="form__input form__input--transparent checkbox__edit"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={hostname}
                />
                {isChanged ? (
                    <button
                        type="submit"
                        className="button button--icon checkbox__button"
                        disabled={!hostname}
                    >
                        <svg className="icon icon--button icon--check">
                            <use xlinkHref="#check" />
                        </svg>
                    </button>
                ) : (
                    <button
                        type="button"
                        className="button button--icon checkbox__button"
                        onClick={handleRemove}
                    >
                        <svg className="icon icon--button icon--cross">
                            <use xlinkHref="#cross" />
                        </svg>
                    </button>
                )}
            </div>
            {checked
                && (
                    <SubdomainsCheckbox
                        id={id}
                        handleToggle={handleToggle}
                        label={label}
                    />
                )}
        </form>
    );
};

export default Checkbox;
