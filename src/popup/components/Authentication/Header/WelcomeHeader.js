import React, { useContext } from 'react';

import translator from '../../../../lib/translator';
import rootStore from '../../../stores';
import BackButton from '../BackButton';

function WelcomeHeader() {
    const { authStore } = useContext(rootStore);

    const title = authStore.step === authStore.STEPS.REGISTRATION
        ? translator.translate('auth_header_registration')
        : translator.translate('auth_header_welcome');

    return (
        <>
            <BackButton />
            <div className="auth__header auth__header--welcome">
                <div className="auth__title">
                    {title}
                </div>
                <div className="auth__subtitle">
                    {authStore.credentials.username}
                </div>
            </div>
        </>
    );
}

export default WelcomeHeader;
