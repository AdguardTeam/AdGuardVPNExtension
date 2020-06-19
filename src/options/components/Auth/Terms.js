import React from 'react';

import { EULA_URL, PRIVACY_URL } from '../../../background/config';
import translator from '../../../lib/translator/translator';

const Terms = () => (
    <>
        <div className="auth__terms">
            {translator.translateReact('options_auth_agreement_consent', {
                privacy: (chunks) => (
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={PRIVACY_URL}
                        type="button"
                        className="auth__term"
                    >
                        {chunks}
                    </a>
                ),
                eula: (chunks) => (
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={EULA_URL}
                        type="button"
                        className="auth__term"
                    >
                        {chunks}
                    </a>
                ),
            })}
        </div>
    </>
);

export default Terms;
