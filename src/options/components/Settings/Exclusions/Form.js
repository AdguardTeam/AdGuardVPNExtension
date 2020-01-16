import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';
import classnames from 'classnames';

import useOutsideClick from '../../helpers/useOutsideClick';
import rootStore from '../../../stores';
import SubdomainsHelp from './SubdomainsHelp';

const Form = observer(({ exclusionsType, enabled }) => {
    const ref = useRef();
    const { settingsStore } = useContext(rootStore);
    const {
        areFormsVisible,
        exclusionsInputs,
        exclusionsCheckboxes,
        addToExclusions,
        onExclusionsInputChange,
        onExclusionsCheckboxChange,
        openExclusionsForm,
        closeExclusionsForm,
    } = settingsStore;

    const isFormVisible = areFormsVisible[exclusionsType];
    const exclusionInput = exclusionsInputs[exclusionsType];
    const exclusionCheckbox = exclusionsCheckboxes[exclusionsType];

    const submitHandler = async (e) => {
        e.preventDefault();
        await addToExclusions(exclusionsType);
    };

    const inputChangeHandler = (e) => {
        const { target: { value } } = e;
        onExclusionsInputChange(exclusionsType, value);
    };

    const checkboxChangeHandler = () => {
        onExclusionsCheckboxChange(exclusionsType, !exclusionCheckbox);
    };

    const openForm = () => {
        openExclusionsForm(exclusionsType);
    };

    useOutsideClick(ref, () => {
        closeExclusionsForm(exclusionsType);
    });

    const formClassName = classnames('settings__form', { 'settings__form--hidden': !enabled });

    return (
        <div className={formClassName} ref={ref}>
            <button
                type="button"
                className="button button--icon button--medium settings__add"
                onClick={openForm}
            >
                <svg className="icon icon--button icon--checked settings__add-icon">
                    <use xlinkHref="#plus" />
                </svg>
                {browser.i18n.getMessage('settings_exclusion_add')}
            </button>

            {isFormVisible && (
                <div className="settings__list-item settings__list-item--active">
                    <form
                        onSubmit={submitHandler}
                        className="form"
                    >
                        <div className="checkbox">
                            <input
                                id="newHostname"
                                type="checkbox"
                                className="checkbox__input"
                                onChange={checkboxChangeHandler}
                                checked={exclusionCheckbox}
                            />
                            <label htmlFor="newHostname" className="checkbox__label">
                                {exclusionCheckbox ? (
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
                                className="form__input form__input--transparent"
                                onChange={inputChangeHandler}
                                value={exclusionInput}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                            <SubdomainsHelp />
                            {exclusionInput ? (
                                <button
                                    type="submit"
                                    className="button button--icon form__submit form__submit--icon"
                                >
                                    <svg className="icon icon--button icon--check">
                                        <use xlinkHref="#check" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="button button--icon checkbox__button"
                                    onClick={() => closeExclusionsForm(exclusionsType)}
                                >
                                    <svg className="icon icon--button icon--cross">
                                        <use xlinkHref="#cross" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
});

export default Form;
