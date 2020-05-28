import React, { useContext } from 'react';

import translator from '../../../../lib/translator';
import rootStore from '../../../stores';
import BackButton from '../BackButton';

function WelcomeHeader() {
    const { authStore } = useContext(rootStore);

    const getTitle = () => {
        if (authStore.step === authStore.STEPS.REGISTRATION) {
            return translator.translate('auth_header_registration');
        }

        if (authStore.step === authStore.STEPS.TWO_FACTOR) {
            return translator.translate('auth_header_2fa');
        }

        if (authStore.step === authStore.STEPS.SIGN_IN && authStore.signInCheck) {
            return translator.translate('auth_header_sign_in');
        }

        return translator.translate('auth_header_sing_in_notice');
    };

    const showCrediantials = authStore.step === authStore.STEPS.REGISTRATION
        || authStore.step === authStore.STEPS.SIGN_IN;

    return (
        <>
            <BackButton />
            <div className="auth__header">
                <div className="auth__title">
                    {translator.translate('short_name')}
                </div>
                <div className="auth__subtitle">
                    {getTitle()}
                    {showCrediantials && (
                        <strong className="auth__credentials">
                            {authStore.credentials.username}
                        </strong>
                    )}
                </div>
            </div>
        </>
    );
}

export default WelcomeHeader;
