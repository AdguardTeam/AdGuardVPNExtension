import React, { useState, useContext } from 'react';
import { observer } from 'mobx-react';
import { useMachine } from '@xstate/react';
import identity from 'lodash/identity';
import classnames from 'classnames';

import { Title } from '../../ui/Title';
import { Checkbox } from '../../ui/Checkbox';
import { rootStore } from '../../../stores';
import { messenger } from '../../../../lib/messenger';
import { addMinDurationTime } from '../../../../lib/helpers';
import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { RequestEvent, RequestState, requestMachine } from './requestMachine';

import './bug-report.pcss';

enum FormField {
    Email = 'email',
    Message = 'message',
    IncludeLog = 'includeLog',
}

interface Validators {
    [key: string]: (value: string) => null | string;
}

type FormStateType = {
    [key: string]: string | boolean;
};

interface FormState extends FormStateType {
    [FormField.Email]: string;
    [FormField.Message]: string;
    [FormField.IncludeLog]: boolean;
}

type FormErrorType = {
    [key: string]: string | undefined | null;
};

interface FormError extends FormErrorType {
    [FormField.Email]?: string | null;
    [FormField.Message]?: string | null;
}

export const BugReporter = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const MIN_DURATION_MS = 500;
    const reportWithMinDuration = addMinDurationTime(
        messenger.reportBug.bind(messenger),
        MIN_DURATION_MS,
    );

    const [requestState, sendToRequestMachine] = useMachine(requestMachine, {
        services: {
            sendReport: async (_, e) => {
                const response = await reportWithMinDuration(
                    e[FormField.Email],
                    e[FormField.Message],
                    e[FormField.IncludeLog],
                );

                if (response.error) {
                    throw new Error(`An error occurred during sending report, status: ${response.status}`);
                }
            },
        },
    });

    const DEFAULT_FORM_STATE: FormState = {
        [FormField.Email]: settingsStore.currentUsername,
        [FormField.Message]: '',
        [FormField.IncludeLog]: false,
    };

    const DEFAULT_ERROR_STATE: FormError = {};

    const [formErrors, setFormErrors] = useState(DEFAULT_ERROR_STATE);
    const [formState, setFormState] = useState(DEFAULT_FORM_STATE);
    const [emailInput, setEmailInput] = useState(formState[FormField.Email]);

    const validators: Validators = {
        [FormField.Email]: (value: string) => {
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            return isValid ? null : translator.getMessage('options_bug_report_email_invalid');
        },
        [FormField.Message]: (value: string) => {
            const isValid = value && value.length >= 0;
            return isValid ? null : translator.getMessage('options_bug_report_textarea_invalid');
        },
    };

    const validateFields = (): FormError => {
        return Object.keys(formState).reduce((acc: FormError, key) => {
            const value = formState[key];
            const validator = validators[key];
            if (validator) {
                if (typeof value === 'string') {
                    acc[key] = validator(value);
                }
            } else {
                acc[key] = null;
            }
            return acc;
        }, {});
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const errors = validateFields();

        if (Object.values(errors).filter(identity).length > 0) {
            setFormErrors(errors);
            return;
        }

        sendToRequestMachine(
            RequestEvent.SendReport,
            {
                [FormField.Email]: formState[FormField.Email].trim(),
                [FormField.Message]: formState[FormField.Message].trim(),
                [FormField.IncludeLog]: formState[FormField.IncludeLog],
            },
        );
    };

    const formChangeHandler = (e: React.ChangeEvent<HTMLFormElement>): void => {
        const { id, value, checked } = e.target;

        const resultValue = e.target.type === 'checkbox' ? checked : value;

        // clear request errors
        sendToRequestMachine(RequestEvent.ClearErrors);

        // clear form validation errors
        setFormErrors((prevState) => {
            return {
                ...prevState,
                [id]: null,
            };
        });

        setFormState((prevState) => {
            return {
                ...prevState,
                [id]: resultValue,
            };
        });
    };

    const emailChangeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { target: { value } } = e;
        setEmailInput(value);
    };

    const emailCleanHandler = (): void => {
        setEmailInput('');
    };

    let buttonText = reactTranslator.getMessage('options_bug_report_send_button');
    let isButtonDisabled = !formState[FormField.Email] || !formState[FormField.Message];

    if (requestState.matches(RequestState.Sending)) {
        buttonText = reactTranslator.getMessage('options_bug_report_sending_button');
        isButtonDisabled = true;
    }

    const closeHandler = (): void => {
        settingsStore.setShowBugReporter(false);
    };

    const bugReportTitle = (
        <div className="bug-report__title">
            <button className="bug-report__back" type="button" onClick={closeHandler}>
                <svg className="icon icon--button">
                    <use xlinkHref="#arrow" />
                </svg>
            </button>
            {reactTranslator.getMessage('options_report_bug_title')}
        </div>
    );

    if (requestState.matches(RequestState.Success)) {
        const newReportClickHandler = () => {
            sendToRequestMachine(RequestEvent.StartAgain);
            setFormState(DEFAULT_FORM_STATE);
            setEmailInput(DEFAULT_FORM_STATE[FormField.Email]);
            setFormErrors(DEFAULT_ERROR_STATE);
        };

        return (
            <>
                <Title title={bugReportTitle} />

                <div className="bug-report">
                    <div className="bug-report__done">
                        <img
                            src="../../../../../assets/images/ninja-like.svg"
                            className="bug-report__image"
                            alt="slide"
                        />
                        <div className="bug-report__description">
                            {reactTranslator.getMessage('options_bug_report_page_success')}
                        </div>
                        <button
                            type="button"
                            onClick={newReportClickHandler}
                            className="button button--medium button--primary bug-report__action"
                        >
                            {reactTranslator.getMessage('options_bug_report_new_report_button')}
                        </button>
                    </div>
                </div>
            </>
        );
    }
    const emailClassName = classnames('input', { 'input--error': formErrors[FormField.Email] });
    const messageClassName = classnames('input', { 'input--error': formErrors[FormField.Message] });

    return (
        <>
            <Title title={bugReportTitle} />

            <div className="bug-report">
                <form
                    className="bug-report__form"
                    noValidate
                    onSubmit={handleSubmit}
                    onChange={formChangeHandler}
                >
                    <div className="bug-report__input">
                        <label
                            className="bug-report__label"
                            htmlFor={FormField.Email}
                        >
                            {reactTranslator.getMessage('options_bug_report_email_label')}
                        </label>
                        <div className={emailClassName}>
                            <input
                                className="input__in input__in--content input__in--close"
                                id={FormField.Email}
                                type="email"
                                placeholder="example@mail.com"
                                value={emailInput}
                                onChange={emailChangeHandler}
                            />
                            {emailInput && (
                                <button
                                    type="button"
                                    className="button button--icon input__close"
                                    onClick={emailCleanHandler}
                                >
                                    <svg className="icon icon--button icon--cross">
                                        <use xlinkHref="#cross" />
                                    </svg>
                                </button>
                            )}
                            <div className="input__error">{formErrors[FormField.Email]}</div>
                        </div>
                    </div>
                    <div className="bug-report__input">
                        <label
                            className="bug-report__label"
                            htmlFor={FormField.Message}
                        >
                            {reactTranslator.getMessage('options_bug_report_textarea_label')}
                        </label>
                        <div className={messageClassName}>
                            {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                            <textarea
                                className="input__in input__in--content input__in--textarea"
                                id={FormField.Message}
                                placeholder={translator.getMessage('options_bug_report_textarea_placeholder')}
                                defaultValue={formState[FormField.Message]}
                            />
                            <div className="input__error">
                                <span>{formErrors[FormField.Message]}</span>
                                {requestState.matches(RequestState.Error)
                                    && <span>{reactTranslator.getMessage('options_bug_report_request_error')}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="bug-report__checkbox">
                        <Checkbox
                            id={FormField.IncludeLog}
                            value={formState[FormField.IncludeLog]}
                        >
                            {reactTranslator.getMessage('options_bug_report_include_log_label')}
                        </Checkbox>
                    </div>
                    <button
                        type="submit"
                        disabled={isButtonDisabled}
                        className="button button--medium button--primary bug-report__action"
                    >
                        {buttonText}
                    </button>
                </form>
            </div>
        </>
    );
});
