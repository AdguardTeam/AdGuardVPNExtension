import React, { useContext } from 'react';

import { rootStore } from '../../stores';

export const BackButton = () => {
    const { authStore } = useContext(rootStore);

    const handleBackClick = async () => {
        await authStore.resetPasswords();
        await authStore.showPrevAuthScreen();
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
};
