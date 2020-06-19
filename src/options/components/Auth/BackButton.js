import React, { useContext } from 'react';

import rootStore from '../../stores';
import translator from '../../../lib/translator/translator';

function BackButton() {
    const { authStore } = useContext(rootStore);

    const handleBackClick = async () => {
        await authStore.showSignIn();
    };

    return (
        <button
            className="button button--icon button--back"
            type="button"
            onClick={handleBackClick}
        >
            <svg className="icon icon--button icon--back">
                <use xlinkHref="#back-arrow" />
            </svg>
            <span>{translator.translateReact('options_auth_back_button')}</span>
        </button>
    );
}

export default BackButton;
