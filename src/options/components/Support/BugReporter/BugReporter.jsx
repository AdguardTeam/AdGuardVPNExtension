import React, { useState, useContext } from 'react';
import { observer } from 'mobx-react';
import { useMachine } from '@xstate/react';
import { identity } from 'lodash';
import classnames from 'classnames';

import { Title } from '../../ui/Title';
import Checkbox from "../../ui/Checkbox";
import rootStore from '../../../stores';
import messenger from '../../../../lib/messenger';
import { addMinDurationTime } from '../../../../lib/helpers';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { REQUEST_EVENTS, REQUEST_STATES, requestMachine } from './requestMachine';

import './bug-report.pcss';

export const BugReporter = observer(({ closeHandler }) => {
    const { settingsStore } = useContext(rootStore);

    const MIN_DURATION_MS = 500;
    const reportWithMinDuration = addMinDurationTime(
        messenger.reportBug.bind(messenger),
        MIN_DURATION_MS,
    );

    const FIELDS = {
        EMAIL: 'email',
        MESSAGE: 'message',
        INCLUDE_LOG: 'includeLog',
    };

    const [requestState, sendToRequestMachine] = useMachine(requestMachine, {
        services: {
            sendReport: async (_, e) => {
                const response = await reportWithMinDuration(
                    e[FIELDS.EMAIL],
                    e[FIELDS.MESSAGE],
                    e[FIELDS.INCLUDE_LOG],
                );

                if (response.error) {
                    throw new Error(`An error occurred during sending report, status: ${response.status}`);
                }
            },
        },
    });

    const DEFAULT_FORM_STATE = {
        [FIELDS.EMAIL]: settingsStore.currentUsername,
        [FIELDS.MESSAGE]: '',
        [FIELDS.INCLUDE_LOG]: false,
    };

    const DEFAULT_ERROR_STATE = {};

    const [formErrors, setFormErrors] = useState(DEFAULT_ERROR_STATE);
    const [formState, setFormState] = useState(DEFAULT_FORM_STATE);

    const validators = {
        [FIELDS.EMAIL]: (value) => {
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            return isValid ? null : reactTranslator.translate('options_bug_report_email_invalid');
        },
        [FIELDS.MESSAGE]: (value) => {
            const isValid = value && value.length >= 0;
            return isValid ? null : reactTranslator.translate('options_bug_report_textarea_invalid');
        },
    };

    const validateFields = () => {
        return Object.keys(formState).reduce((acc, key) => {
            const value = formState[key];
            const validator = validators[key];
            if (validator) {
                acc[key] = validator(value);
            } else {
                acc[key] = null;
            }
            return acc;
        }, {});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateFields();

        if (Object.values(errors).filter(identity).length > 0) {
            setFormErrors(errors);
            return;
        }

        sendToRequestMachine(
            REQUEST_EVENTS.SEND_REPORT,
            {
                [FIELDS.EMAIL]: formState[FIELDS.EMAIL].trim(),
                [FIELDS.MESSAGE]: formState[FIELDS.MESSAGE].trim(),
                [FIELDS.INCLUDE_LOG]: formState[FIELDS.INCLUDE_LOG],
            },
        );
    };

    const formChangeHandler = (e) => {
        const { id, value, checked } = e.target;

        const resultValue = e.target.type === 'checkbox' ? checked : value;

        // clear request errors
        sendToRequestMachine(REQUEST_EVENTS.CLEAR_ERRORS);

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

    let buttonText = reactTranslator.translate('options_bug_report_send_button');
    let isButtonDisabled = !formState[FIELDS.EMAIL] || !formState[FIELDS.MESSAGE];

    if (requestState.matches(REQUEST_STATES.SENDING)) {
        buttonText = reactTranslator.translate('options_bug_report_sending_button');
        isButtonDisabled = true;
    }

    const bugReportTitle = (
        <div className="bug-report__title">
            <button className="bug-report__back" type="button" onClick={closeHandler}>
                <svg className="icon icon--button">
                    <use xlinkHref="#arrow" />
                </svg>
            </button>
            {reactTranslator.translate('options_report_bug_title')}
        </div>
    );

    if (requestState.matches(REQUEST_STATES.SUCCESS)) {
        const newReportClickHandler = () => {
            sendToRequestMachine(REQUEST_EVENTS.START_AGAIN);
            setFormState(DEFAULT_FORM_STATE);
            setFormErrors(DEFAULT_ERROR_STATE);
        };

        return (
            <>
                <Title title={bugReportTitle} />

                <div className="bug-report">
                    <div className="bug-report__description">
                        <svg className="icon icon--check icon--button bug-report__check">
                            <use xlinkHref="#check" />
                        </svg>
                        {reactTranslator.translate('options_bug_report_page_success')}
                    </div>
                    <button
                        type="button"
                        onClick={newReportClickHandler}
                        className="button button--medium button--outline-primary bug-report__action"
                    >
                        {reactTranslator.translate('options_bug_report_new_report_button')}
                    </button>
                </div>
            </>
        );
    }
    const emailClassName = classnames('input', { 'input--error': formErrors[FIELDS.EMAIL] });
    const messageClassName = classnames('input', { 'input--error': formErrors[FIELDS.MESSAGE] });

    return (
        <>
            <Title title={bugReportTitle} />

            <div className="bug-report">
                <form
                    className="bug-report__form"
                    onSubmit={handleSubmit}
                    onChange={formChangeHandler}
                >
                    <label
                        className="bug-report__label"
                        htmlFor={FIELDS.EMAIL}
                    >
                        {reactTranslator.translate('options_bug_report_email_label')}
                    </label>
                    <div className={emailClassName}>
                        <input
                            className="input__in input__in--content"
                            id={FIELDS.EMAIL}
                            type="email"
                            placeholder="example@mail.com"
                            defaultValue={formState[FIELDS.EMAIL]}
                        />
                        <div className="input__error">{formErrors[FIELDS.EMAIL]}</div>
                    </div>
                    <label
                        className="bug-report__label"
                        htmlFor={FIELDS.MESSAGE}
                    >
                        {reactTranslator.translate('options_bug_report_textarea_label')}
                    </label>
                    <div className={messageClassName}>
                        <textarea
                            className="input__in input__in--content input__in--textarea"
                            id={FIELDS.MESSAGE}
                            placeholder={reactTranslator.translate('options_bug_report_textarea_placeholder')}
                            defaultValue={formState[FIELDS.MESSAGE]}
                        />
                        <div className="input__error">
                            <span>{formErrors[FIELDS.MESSAGE]}</span>
                            { requestState.matches(REQUEST_STATES.ERROR)
                            && <span>{reactTranslator.translate('options_bug_report_request_error')}</span>}
                        </div>
                    </div>
                    <div className="bug-report__checkbox">
                        <Checkbox
                            id={FIELDS.INCLUDE_LOG}
                            value={formState[FIELDS.INCLUDE_LOG]}
                        >
                            {reactTranslator.translate('options_bug_report_include_log_label')}
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
