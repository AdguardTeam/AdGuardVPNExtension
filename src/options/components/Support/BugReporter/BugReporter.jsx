import React, { useState, useContext } from 'react';
import { observer } from 'mobx-react';
import { useMachine } from '@xstate/react';
import { identity } from 'lodash';

import { Title } from '../../ui/Title';
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
    };

    const [requestState, sendToRequestMachine] = useMachine(requestMachine, {
        services: {
            sendReport: async (_, e) => {
                const response = await reportWithMinDuration(e[FIELDS.EMAIL], e[FIELDS.MESSAGE]);
                if (response.error) {
                    throw new Error(`An error occurred during sending report, status: ${response.status}`);
                }
            },
        },
    });

    const DEFAULT_FORM_STATE = {
        [FIELDS.EMAIL]: settingsStore.currentUsername,
        [FIELDS.MESSAGE]: '',
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
            acc[key] = validator(value);
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
                [FIELDS.EMAIL]: formState.email.trim(),
                [FIELDS.MESSAGE]: formState.message.trim(),
            },
        );
    };

    const formChangeHandler = (e) => {
        const { id, value } = e.target;

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
                [id]: value,
            };
        });
    };

    let buttonText = reactTranslator.translate('options_bug_report_send_button');
    let isButtonDisabled = !formState[FIELDS.EMAIL] || !formState[FIELDS.MESSAGE];

    if (requestState.matches(REQUEST_STATES.SENDING)) {
        buttonText = reactTranslator.translate('options_bug_report_sending_button');
        isButtonDisabled = true;
    }

    if (requestState.matches(REQUEST_STATES.SUCCESS)) {
        const newReportClickHandler = () => {
            sendToRequestMachine(REQUEST_EVENTS.START_AGAIN);
            setFormState(DEFAULT_FORM_STATE);
            setFormErrors(DEFAULT_ERROR_STATE);
        };

        return (
            <>
                {/* FIXME replace with icon */}
                <button type="button" onClick={closeHandler}>Back</button>

                <Title title={reactTranslator.translate('options_report_bug_title')} />

                <div className="bug-report">
                    <div className="bug-report__description">
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
    return (
        <>
            {/* FIXME replace with icon */}
            <button type="button" onClick={closeHandler}>Back</button>

            <Title title={reactTranslator.translate('options_report_bug_title')} />

            <div className="bug-report">
                <div className="bug-report__description">
                    {reactTranslator.translate('options_bug_report_page_description')}
                </div>
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
                    <input
                        id={FIELDS.EMAIL}
                        type="email"
                        placeholder="example@mail.com"
                        defaultValue={formState[FIELDS.EMAIL]}
                    />
                    <div>{formErrors[FIELDS.EMAIL]}</div>
                    <label
                        className="bug-report__label"
                        htmlFor={FIELDS.MESSAGE}
                    >
                        {reactTranslator.translate('options_bug_report_textarea_label')}
                    </label>
                    <textarea
                        id={FIELDS.MESSAGE}
                        placeholder={reactTranslator.translate('options_bug_report_textarea_placeholder')}
                        defaultValue={formState[FIELDS.MESSAGE]}
                    />
                    <div>{formErrors[FIELDS.MESSAGE]}</div>
                     { requestState.matches(REQUEST_STATES.ERROR)
                        && <div>{reactTranslator.translate('options_bug_report_request_error')}</div>}

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
