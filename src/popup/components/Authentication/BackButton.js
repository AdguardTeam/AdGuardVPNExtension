import React, { useContext } from 'react';

import rootStore from '../../stores';

function BackButton() {
    const { authStore } = useContext(rootStore);

    const handleBackClick = async () => {
        await authStore.showCheckEmail();
    };

    return (
        <button
            className="button button--back button--gray"
            type="button"
            onClick={handleBackClick}
        >
            <svg className="icon icon--button">
                <use xlinkHref="#back" />
            </svg>
        </button>
    );
}

export default BackButton;
