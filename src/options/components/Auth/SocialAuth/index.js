import React, { useContext } from 'react';

import rootStore from '../../../stores';
import './social-auth.pcss';

const SOCIAL_PROVIDERS = ['google', 'facebook'];

const SocialAuth = () => {
    const { authStore } = useContext(rootStore);

    const socialAuthClickHandler = (social) => async () => {
        await authStore.openSocialAuth(social);
    };

    return (
        <div className="social-auth">
            <div className="social-auth__list">
                {SOCIAL_PROVIDERS.map((name) => (
                    <button
                        key={name}
                        type="button"
                        onClick={socialAuthClickHandler(name)}
                        className="button button--icon social-auth__button"
                    >
                        <svg className="social-auth__wrap">
                            <use xlinkHref={`#social_${name}`} />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SocialAuth;
