import React, { useContext } from 'react';

import translator from '../../../../lib/translator';
import rootStore from '../../../stores';
import BackButton from '../BackButton';

function WelcomeHeader() {
    const { authStore } = useContext(rootStore);

    return (
        <>
            <BackButton />
            <div className="auth__header auth__header--welcome">
                <div className="auth__title">
                    {translator.translate('auth_welcome')}
                </div>
                <div className="auth__subtitle">
                    {authStore.credentials.username}
                </div>
            </div>
        </>
    );
}

export default WelcomeHeader;
