import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import rootStore from '../../../stores';

const Form = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        isFormVisible,
        exclusionsInput,
        addToExclusions,
        onExclusionsInputChange,
        toggleExclusionsForm,
    } = settingsStore;

    const submitHandler = async (e) => {
        e.preventDefault();
        await addToExclusions();
    };

    const inputChangeHandler = (e) => {
        const { target: { value } } = e;
        onExclusionsInputChange(value);
    };

    const toggleForm = () => {
        toggleExclusionsForm();
    };

    return (
        <div className="settings__form">
            <button
                type="button"
                className="button button--icon button--medium settings__add"
                onClick={toggleForm}
            >
                <svg className="icon icon--button icon--checked settings__add-icon">
                    <use xlinkHref="#plus" />
                </svg>
                {browser.i18n.getMessage('settings_exclusion_add')}
            </button>

            {isFormVisible && (
                <form onSubmit={submitHandler} className="form__group form__group--settings">
                    <input
                        type="text"
                        className="form__input form__input--transparent"
                        onChange={inputChangeHandler}
                        value={exclusionsInput}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="button button--icon form__submit form__submit--icon"
                        disabled={!exclusionsInput}
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
