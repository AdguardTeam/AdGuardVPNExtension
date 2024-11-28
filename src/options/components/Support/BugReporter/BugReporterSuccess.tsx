import React from 'react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { useCenteredView } from '../../../hooks/useCenteredView';
import { Button } from '../../ui/Button';

export interface BugReporterSuccessProps {
    onClick: () => void;
}

export function BugReporterSuccess({ onClick }: BugReporterSuccessProps) {
    useCenteredView();

    return (
        <div className="bug-reporter__success">
            <img
                src="../../../../assets/images/ninja-like.svg"
                className="bug-reporter__success-image"
                alt="slide"
            />
            {/* FIXME: Translation */}
            <div className="bug-reporter__success-title">
                Thank you, your message sent successfully!
            </div>
            <Button className="bug-reporter__success-btn" onClick={onClick}>
                {reactTranslator.getMessage('options_bug_report_new_report_button')}
            </Button>
        </div>
    );
}
