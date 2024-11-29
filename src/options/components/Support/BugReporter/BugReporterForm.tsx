import React, { useState } from 'react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { Title } from '../../ui/Title';
import { Input, TextArea } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Button } from '../../ui/Button';

import { validateEmail, validateMessage } from './validate';

export interface BugReporterFormProps {
    isSending: boolean;
    initialEmail?: string;
    error?: string | null;
    onBackClick: () => void;
    onSubmit: (email: string, message: string, includeLog: boolean) => void;
    onChange: () => void;
}

export function BugReporterForm({
    isSending,
    initialEmail,
    error,
    onBackClick,
    onSubmit,
    onChange,
}: BugReporterFormProps) {
    const [email, setEmail] = useState<string>(initialEmail ?? '');
    const [emailError, setEmailError] = useState<string | null>(null);

    const [message, setMessage] = useState('');
    const [messageError, setMessageError] = useState<string | null>(null);

    const [includeLog, setIncludeLog] = useState(false);

    const handleEmailChange = (email: string) => {
        setEmail(email);
        if (emailError) {
            setEmailError(null);
        }
    };

    const handleMessageChange = (message: string) => {
        setMessage(message);
        if (messageError) {
            setMessageError(null);
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const sanitizedEmail = email.trim();
        const emailError = validateEmail(sanitizedEmail);
        if (emailError) {
            setEmailError(emailError);
            return;
        }

        const sanitizedMessage = message.trim();
        const messageError = validateMessage(sanitizedMessage);
        if (messageError) {
            setMessageError(messageError);
            return;
        }

        onSubmit(sanitizedEmail, sanitizedMessage, includeLog);
    };

    let buttonText = reactTranslator.getMessage('options_bug_report_send_button');
    if (isSending) {
        buttonText = reactTranslator.getMessage('options_bug_report_sending_button');
    }

    return (
        <>
            <Title
                title={reactTranslator.getMessage('options_report_bug_title')}
                onClick={onBackClick}
            />
            <form
                className="bug-reporter__form"
                onSubmit={handleSubmit}
                onChange={onChange}
            >
                <Input
                    id="email"
                    name="email"
                    type="email"
                    label={reactTranslator.getMessage('options_bug_report_email_label')}
                    placeholder="example@mail.com"
                    value={email}
                    error={emailError}
                    onChange={handleEmailChange}
                    required
                />
                <TextArea
                    id="message"
                    name="message"
                    label={reactTranslator.getMessage('options_bug_report_textarea_label')}
                    placeholder={translator.getMessage('options_bug_report_textarea_placeholder')}
                    value={message}
                    error={messageError}
                    onChange={handleMessageChange}
                    required
                />
                <Checkbox
                    title={reactTranslator.getMessage('options_bug_report_include_log_label')}
                    value={includeLog}
                    onChange={setIncludeLog}
                />
                {error && (
                    <div className="bug-reporter__form-error">
                        {error}
                    </div>
                )}
                <Button
                    type="submit"
                    className="bug-reporter__form-btn"
                    disabled={!email || !message || isSending}
                >
                    {buttonText}
                </Button>
            </form>
        </>
    );
}
