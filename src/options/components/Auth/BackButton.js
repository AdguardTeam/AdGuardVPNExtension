import React, { useContext } from 'react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';

const BackButton = () => {
    const { authStore } = useContext(rootStore);

    const handleBackClick = async () => {
        await authStore.showSignIn();
    };

    return (
        <button
            className="button button--icon button--back button--gray"
            type="button"
            onClick={handleBackClick}
        >
            <svg className="icon icon--button icon--back">
                <use xlinkHref="#back-arrow" />
            </svg>
            <span>{reactTranslator.getMessage('options_auth_back_button')}</span>
        </button>
    );
};

export default BackButton;
