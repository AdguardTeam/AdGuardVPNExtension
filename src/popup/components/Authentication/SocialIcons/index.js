import React, { useContext } from 'react';
import rootStore from '../../../stores';

import './social-icons.pcss';

function SocialIcons() {
    const { authStore } = useContext(rootStore);

    const socialAuthClickHandler = social => async () => {
        await authStore.openSocialAuth(social);
    };

    return (
        <div className="social-icons">
            <div className="social-icons__title">
                Login by social:
            </div>
            <div className="social-icons__items">
                <button
                    type="button"
                    onClick={socialAuthClickHandler('twitter')}
                    className="social-icons__item button button--social button--twitter"
                />
                <button
                    type="button"
                    onClick={socialAuthClickHandler('google')}
                    className="social-icons__item button button--social button--google"
                />
                <button
                    type="button"
                    onClick={socialAuthClickHandler('yandex')}
                    className="social-icons__item button button--social button--yd"
                />
                <button
                    type="button"
                    onClick={socialAuthClickHandler('vk')}
                    className="social-icons__item button button--social button--vk"
                />
            </div>
        </div>
    );
}

export default SocialIcons;
