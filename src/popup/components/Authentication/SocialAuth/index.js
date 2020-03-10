import React, { useContext } from 'react';

import rootStore from '../../../stores';
import './social-auth.pcss';

const SOCIAL_PROVIDERS = ['twitter', 'google', 'facebook', 'yandex', 'vk'];

function SocialAuth() {
    const { authStore } = useContext(rootStore);

    const socialAuthClickHandler = (social) => async () => {
        await authStore.openSocialAuth(social);
    };

    return (
        <div className="social-auth">
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
    );
}

export default SocialAuth;
