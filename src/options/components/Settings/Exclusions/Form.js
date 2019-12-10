import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';
import classnames from 'classnames';

import useOutsideClick from '../../helpers/useOutsideClick';
import rootStore from '../../../stores';

const Form = observer(({ exclusionsType, enabled }) => {
    const ref = useRef();
    const { settingsStore } = useContext(rootStore);
    const {
        areFormsVisible,
        exclusionsInputs,
        addToExclusions,
        onExclusionsInputChange,
        openExclusionsForm,
        closeExclusionsForm,
    } = settingsStore;

    const isFormVisible = areFormsVisible[exclusionsType];
    const exclusionInput = exclusionsInputs[exclusionsType];

    const submitHandler = async (e) => {
        e.preventDefault();
        await addToExclusions(exclusionsType);
    };

    const inputChangeHandler = (e) => {
        const { target: { value } } = e;
        onExclusionsInputChange(exclusionsType, value);
    };

    const openForm = () => {
        openExclusionsForm(exclusionsType);
    };

    useOutsideClick(ref, () => {
        closeExclusionsForm(exclusionsType);
    });

    const formClassName = classnames('settings__form', { 'settings__form--disabled': !enabled });

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
                <form
                    onSubmit={submitHandler}
                    className="form__group form__group--settings"
                >
                    <input
                        type="text"
                        className="form__input form__input--transparent"
                        onChange={inputChangeHandler}
                        value={exclusionInput}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="button button--icon form__submit form__submit--icon"
                        disabled={!exclusionInput}
                    >
                        <svg className="icon icon--button icon--check">
                            <use xlinkHref="#check" />
                        </svg>
                    </button>
                </form>
            )}
        </div>
    );
});

export default Form;
