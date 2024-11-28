import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { messenger } from '../../../../common/messenger';
import { translator } from '../../../../common/translator';
import { addMinDurationTime } from '../../../../common/helpers';
import { rootStore } from '../../../stores';

import { BugReporterForm } from './BugReporterForm';
import { BugReporterSuccess } from './BugReporterSuccess';

import './bug-reporter.pcss';

enum State {
    Idle,
    Sending,
    Success,
    Error,
}

export const BugReporter = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [state, setState] = useState(State.Idle);
    const [error, setError] = useState<string | null>(null);

    const handleGoBack = () => {
        settingsStore.setShowBugReporter(false);
    };

    const MIN_DURATION_MS = 500;
    const reportWithMinDuration = addMinDurationTime(
        messenger.reportBug.bind(messenger),
        MIN_DURATION_MS,
    );

    const handleSubmit = async (email: string, message: string, includeLog: boolean) => {
        try {
            setState(State.Sending);

            const response = await reportWithMinDuration(email, message, includeLog);
            if (response.error) {
                throw new Error(translator.getMessage('options_bug_report_page_error', {
                    status: response.status,
                }));
            }

            setState(State.Success);
        } catch (err) {
            setState(State.Error);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(translator.getMessage('options_bug_report_page_error_unknown'));
            }
        }
    };

    const handleChange = () => {
        setState(State.Idle);
    };

    if (state === State.Success) {
        return <BugReporterSuccess onClick={handleChange} />;
    }

    return (
        <BugReporterForm
            isSending={state === State.Sending}
            initialEmail={settingsStore.currentUsername}
            error={state === State.Error ? error : null}
            onBackClick={handleGoBack}
            onSubmit={handleSubmit}
            onChange={handleChange}
        />
    );
});
