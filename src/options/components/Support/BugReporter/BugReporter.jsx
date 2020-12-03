import React from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { Title } from '../../ui/Title';

// FIXME add back button
// FIXME fill email input
export const BugReporter = () => {
    return (
        <>
            <button>Back</button>
            <Title title={reactTranslator.translate('options_support_title')} />
            {/* eslint-disable-next-line max-len */}
            <div>Please include the problem description (did it start after an update?) and info about other software you have (VPN/AV/extension)</div>
            <form action="#">
                <input type="email" />
                <label htmlFor="email">Email</label>
                <textarea
                    name="bug-report"
                    id="bug-report"
                    cols="30"
                    rows="10"
                    placeholder="Please enter your message"
                />
                <label htmlFor="bug-report" />

                <button>Send</button>
            </form>
        </>
    );
};
