import React from 'react';

import BackButton from '../BackButton';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

function WelcomeHeader() {
    return (
        <>
            <BackButton />
            <div className="auth__header">
                <div className="auth__title">
                    {reactTranslator.translate('short_name')}
                </div>
            </div>
        </>
    );
}

export default WelcomeHeader;
