import React from 'react';
import { authStore } from '../../../stores';

import './social-icons.pcss';

function SocialIcons(props) {
    const socialAuthClickHandler = social => async () => {
        await authStore.openSocialAuth(social);
    };
    const { title } = props;

    return (
        <div className="social-icons">
            <div className="social-icons__title">
                { title }
            </div>
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
    );
}

export default SocialIcons;
