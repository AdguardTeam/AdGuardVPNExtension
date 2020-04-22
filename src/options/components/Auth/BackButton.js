import React, { useContext } from 'react';

import rootStore from '../../stores';

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
            <span>Back</span>
        </button>
    );
}

export default BackButton;
