import React from 'react';

import { EULA_URL, PRIVACY_URL } from '../../../background/config';

// TODO translations
const Terms = () => (
    <>
        <div className="auth__terms">
            By continuing you accept the&nbsp;
            <div>
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={PRIVACY_URL}
                    type="button"
                    className="auth__term"
                >
                    Terms and Conditions
                </a>
                &nbsp;and&nbsp;
                <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={EULA_URL}
                    type="button"
                    className="auth__term"
                >
                    EULA
                </a>
            </div>
        </div>
    </>
);

export default Terms;
