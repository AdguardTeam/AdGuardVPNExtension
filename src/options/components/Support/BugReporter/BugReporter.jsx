import React, { useState } from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { Title } from '../../ui/Title';

import './bug-report.pcss';

// FIXME add back button
// FIXME fill email input
export const BugReporter = ({ closeHandler }) => {
    const [formState, setFormState] = useState({
        email: '',
        bug_description: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formState);
    };

    const formChangeHandler = (e) => {
        const { id, value } = e.target;

        setFormState((prevState) => {
            return {
                ...prevState,
                [id]: value,
            };
        });
    };

    console.log(formState);

    return (
        <>
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
                        htmlFor="email"
                    >
                        {reactTranslator.translate('options_bug_report_email_label')}
                    </label>
                    <input
                        type="email"
                        id="email"
                        placeholder="example@mail.com"
                        defaultValue={formState.email}
                    />

                    <label
                        className="bug-report__label"
                        htmlFor="bug_report_description"
                    >
                        {reactTranslator.translate('options_bug_report_textarea_label')}
                    </label>
                    <textarea
                        name="bug_description"
                        id="bug_description"
                        placeholder={reactTranslator.translate('options_bug_report_textarea_placeholder')}
                        defaultValue={formState.bug_description}
                    />

                    {/* FIXME disable button if form is empty */}
                    {/* FIXME add sending state to the button */}
                    {/* FIXME handle network connection errors */}
                    <button
                        type="submit"
                        className="button button--medium button--primary bug-report__action"
                    >
                        {reactTranslator.translate('options_bug_report_send_button')}
                    </button>
                </form>
            </div>
        </>
    );
};
