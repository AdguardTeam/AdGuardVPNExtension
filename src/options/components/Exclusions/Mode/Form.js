import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import useOutsideClick from '../../helpers/useOutsideClick';
import { rootStore } from '../../../stores';
import SubdomainsHelp from './SubdomainsHelp';
import { reactTranslator } from '../../../../common/reactTranslator';
import { ImportExport } from '../ImportExport';

const Form = observer(() => {
    const ref = useRef(null);
    const { settingsStore } = useContext(rootStore);
    const {
        areFormsVisible,
        exclusionsInputs,
        exclusionsCheckboxes,
        exclusionsCurrentMode,
        addToExclusions,
        onExclusionsInputChange,
        onExclusionsCheckboxChange,
        openExclusionsForm,
        closeExclusionsForm,
    } = settingsStore;

    const isFormVisible = areFormsVisible[exclusionsCurrentMode];
    const exclusionInput = exclusionsInputs[exclusionsCurrentMode];
    const exclusionCheckbox = exclusionsCheckboxes[exclusionsCurrentMode];

    const submitHandler = async (e) => {
        e.preventDefault();
        await addToExclusions(exclusionsCurrentMode);
    };

    const inputChangeHandler = (e) => {
        const { target: { value } } = e;
        onExclusionsInputChange(exclusionsCurrentMode, value);
    };

    const inputBlurHandler = async () => {
        await addToExclusions(exclusionsCurrentMode);
    };

    const checkboxChangeHandler = () => {
        onExclusionsCheckboxChange(exclusionsCurrentMode, !exclusionCheckbox);
    };

    const openForm = () => {
        openExclusionsForm(exclusionsCurrentMode);
    };

    useOutsideClick(ref, () => {
        closeExclusionsForm(exclusionsCurrentMode);
    });

    const iconClass = classnames('icon icon--button', {
        'icon--checked': exclusionCheckbox,
        'icon--unchecked': !exclusionCheckbox,
    });

    const iconXlink = classnames({
        '#checked': exclusionCheckbox,
        '#unchecked': !exclusionCheckbox,
    });

    return (
        <div className="settings__form" ref={ref}>
            <div className="settings__controls settings__controls--import-export">
                <button
                    type="button"
                    className="button button--icon button--medium settings__add"
                    onClick={openForm}
                >
                    <svg className="icon icon--button icon--checked settings__add-icon">
                        <use xlinkHref="#plus" />
                    </svg>
                    {reactTranslator.getMessage('settings_exclusion_add')}
                </button>
                <ImportExport />
            </div>

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
                                <svg className={iconClass}>
                                    <use xlinkHref={iconXlink} />
                                </svg>
                            </label>
                            <input
                                type="text"
                                className="form__input form__input--transparent"
                                onChange={inputChangeHandler}
                                onBlur={inputBlurHandler}
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
                                    onClick={() => closeExclusionsForm(exclusionsCurrentMode)}
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
