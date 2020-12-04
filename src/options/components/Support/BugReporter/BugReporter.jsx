import React from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { Title } from '../../ui/Title';

import './bug-report.pcss';

// FIXME add back button
// FIXME fill email input
export const BugReporter = ({ closeHandler }) => {
    const handleSubmit = (e) => {
        console.log(e.target.value);
    };

    return (
        <>
            <button onClick={closeHandler}>Back</button>
            <Title title={reactTranslator.translate('options_report_bug_title')} />
            <div className="bug-report">
                <div className="bug-report__description">
                    {reactTranslator.translate('options_bug_report_page_description')}
                </div>
                <form className="bug-report__form" onSubmit={handleSubmit}>
                    <label className="bug-report__label" htmlFor="email">Email</label>
                    <input type="email" placeholder="example@mail.com" />
                    <label className="bug-report__label" htmlFor="bug-report">
                        {reactTranslator.translate('options_bug_report_textarea_label')}
                    </label>
                    <textarea
                        aria-placeholder={reactTranslator.translate('options_bug_report_textarea_placeholder')}
                        name="bug-report"
                        id="bug-report"
                        cols="30"
                        rows="10"
                        placeholder="Please enter your message"
                    />

                    <button>Send</button>
                </form>
            </div>
        </>
    );
};
