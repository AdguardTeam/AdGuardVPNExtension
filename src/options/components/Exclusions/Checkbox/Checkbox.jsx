import React, { useState, useRef } from 'react';
import classnames from 'classnames';

import SubdomainsHelp from '../Mode/SubdomainsHelp';
import { useOnClickOutside } from './useOnClickOutside';

import './checkbox.pcss';

export const Checkbox = ({
    id,
    label,
    checked,
    handleToggle,
    handleRename,
    handleRemove,
}) => {
    const [hostname, setHostname] = useState(label);
    const [isChanged, setIsChanged] = useState(false);

    const formRef = useRef();

    const prepareUrl = (url) => {
        return url
            ?.trim()
            ?.toLowerCase()
            ?.replace(/http(s)?:\/\//, '')
            ?.replace(/\/$/, '');
    };

    /**
     * It is impossible to use onBlur event because it causes bugs like AG-6430
     * when checkbox button is replaced with delete
     * button on blur event too fast and user unexpectedly is clicking on delete button
     */
    useOnClickOutside(formRef, () => {
        if (!isChanged) {
            return;
        }

        if (hostname.length <= 0) {
            handleRemove();
        } else {
            handleRename(hostname);
            setHostname(prepareUrl(hostname));
            setIsChanged(false);
        }
    });

    const handleChange = (e) => {
        setIsChanged(hostname !== e.target.value);
        setHostname(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedHostname = hostname.trim();
        handleRename(trimmedHostname);
        setHostname(prepareUrl(hostname));
        setIsChanged(false);
    };

    const iconClass = classnames('icon icon--button', {
        'icon--checked': checked,
        'icon--unchecked': !checked,
    });

    const iconXlink = classnames({
        '#checked': checked,
        '#unchecked': !checked,
    });

    return (
        <form
            ref={formRef}
            className="form"
            onSubmit={handleSubmit}
        >
            <div className="checkbox">
                <input
                    id={id}
                    name={id}
                    type="checkbox"
                    className="checkbox__input"
                    checked={checked}
                    onChange={handleToggle}
                />
                <label htmlFor={id} className="checkbox__label">
                    <svg className={iconClass}>
                        <use xlinkHref={iconXlink} />
                    </svg>
                </label>
                <input
                    type="text"
                    name="hostname"
                    className="form__input form__input--transparent checkbox__edit"
                    onChange={handleChange}
                    value={hostname}
                />
                <div className="checkbox__help">
                    <SubdomainsHelp />
                </div>
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
        </form>
    );
};
