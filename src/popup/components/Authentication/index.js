import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './authentication.pcss';
import rootStore from '../../stores';
import SocialIcons from './SocialIcons';
import SignInForm from './SignInForm';
import RegistrationForm from './RegistrationForm';

const Authentication = observer(() => {
    const { authStore } = useContext(rootStore);
    // TODO [maximtop] remove this method before publishing extension
    const handleFakeAuthentication = async () => {
        await authStore.fakeAuthenticate();
    };

    const getTitle = (step) => {
        const titleMaps = {
            signIn: 'Unlimited VPN',
            registration: 'Registration',
        };
        return titleMaps[step] || titleMaps.signIn;
    };

    const getForm = (step) => {
        if (step === authStore.STEPS.REGISTRATION) {
            return <RegistrationForm />;
        }
        return <SignInForm />;
    };

    const { step } = authStore;
    return (
        <div className="authentication">
            <div className="authentication__header">
                {step === authStore.STEPS.SIGN_IN ? (
                    <div className="authentication__presentation">
                            Free
                    </div>
                ) : (
                    <button
                        className="button button--back"
                        role="button"
                        onClick={authStore.showSignIn}
                    />
                )}
                <div
                    className="authentication__title"
                    onClick={handleFakeAuthentication}
                >
                    {getTitle(step)}
                </div>
                {step === authStore.STEPS.SIGN_IN && <SocialIcons title="Login to start:" />}
            </div>
            {getForm(step)}
        </div>
    );
});

export default Authentication;
