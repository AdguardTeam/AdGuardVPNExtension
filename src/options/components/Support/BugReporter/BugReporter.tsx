import React, { useState, useContext } from 'react';
import { observer } from 'mobx-react';

import { useMachine } from '@xstate/react';
import identity from 'lodash/identity';

import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { addMinDurationTime } from '../../../../common/helpers';
import { messenger } from '../../../../common/messenger';
import { translator } from '../../../../common/translator';
import ninjaLikeImageUrl from '../../../../assets/images/ninja-like.svg';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { Input, TextArea } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Button } from '../../ui/Button';

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

/**
 * Bug reporter page component.
 */
export const BugReporter = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SupportReportBugScreen,
    );

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

    const handleNewReport = () => {
        sendToRequestMachine(RequestEvent.StartAgain);
        setFormState(DEFAULT_FORM_STATE);
        setEmailInput(DEFAULT_FORM_STATE[FormField.Email]);
        setFormErrors(DEFAULT_ERROR_STATE);
    };

    const validateFields = (): FormError => {
        return Object.keys(formState).reduce((acc: FormError, key) => {
            const value = formState[key];
            const validator = validators[key];
            if (validator) {
                if (typeof value === 'string') {
                    acc[key] = validator(value.trim());
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

        // Send telemetry event only if fields are valid
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SendReportClick,
            TelemetryScreenName.SupportReportBugScreen,
        );

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

        const isCheckbox = e.target.type === 'checkbox';
        const resultValue = isCheckbox ? checked : value;

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

        // Send telemetry event only when checkbox becomes active
        if (isCheckbox && resultValue) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.SendInfoClick,
                TelemetryScreenName.SupportReportBugScreen,
            );
        }
    };

    let buttonText = translator.getMessage('options_bug_report_send_button');
    let isButtonDisabled = !formState[FormField.Email] || !formState[FormField.Message];
    if (requestState.matches(RequestState.Sending)) {
        buttonText = translator.getMessage('options_bug_report_sending_button');
        isButtonDisabled = true;
    }

    const closeHandler = (): void => {
        settingsStore.setShowBugReporter(false);
    };

    if (requestState.matches(RequestState.Success)) {
        return (
            <div className="bug-report__success">
                <img
                    src={ninjaLikeImageUrl}
                    className="bug-report__success-image"
                    alt="slide"
                />
                <div className="bug-report__success-title">
                    {translator.getMessage('options_bug_report_page_success')}
                </div>
                <Button
                    size="medium"
                    className="bug-report__success-btn"
                    onClick={handleNewReport}
                >
                    {translator.getMessage('options_bug_report_new_report_button')}
                </Button>
            </div>
        );
    }

    return (
        <>
            <Title
                title={translator.getMessage('options_report_bug_title')}
                onClick={closeHandler}
            />

            <form
                className="bug-report__form"
                noValidate
                onSubmit={handleSubmit}
                onChange={formChangeHandler}
            >
                <Input
                    id={FormField.Email}
                    label={translator.getMessage('options_bug_report_email_label')}
                    type="email"
                    placeholder="example@mail.com"
                    value={emailInput}
                    error={formErrors[FormField.Email]}
                    onChange={setEmailInput}
                />
                <TextArea
                    id={FormField.Message}
                    label={translator.getMessage('options_bug_report_textarea_label')}
                    placeholder={translator.getMessage('options_bug_report_textarea_placeholder')}
                    value={formState[FormField.Message]}
                    error={formErrors[FormField.Message]}
                />
                <Checkbox
                    id={FormField.IncludeLog}
                    label={translator.getMessage('options_bug_report_include_log_label')}
                    value={formState[FormField.IncludeLog]}
                />
                {requestState.matches(RequestState.Error) && (
                    <div className="bug-report__form-error">
                        {translator.getMessage('options_bug_report_request_error')}
                    </div>
                )}
                <Button
                    type="submit"
                    size="medium"
                    className="bug-report__form-btn"
                    disabled={isButtonDisabled}
                >
                    {buttonText}
                </Button>
            </form>
        </>
    );
});
