import React from 'react';

import translator from '../../../../lib/translator';
import BackButton from '../BackButton';

function WelcomeHeader() {
    return (
        <>
            <BackButton />
            <div className="auth__header">
                <div className="auth__title">
                    {translator.translate('short_name')}
                </div>
            </div>
        </>
    );
}

export default WelcomeHeader;
