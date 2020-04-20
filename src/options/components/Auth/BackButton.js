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
            <svg className="icon icon--button">
                <use xlinkHref="#back-arrow" />
            </svg>
            Back
        </button>
    );
}

export default BackButton;
