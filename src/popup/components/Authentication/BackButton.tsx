import React, { useContext } from 'react';

import { rootStore } from '../../stores';
import { IconButton } from '../../../common/components/Icons';

export const BackButton = () => {
    const { authStore } = useContext(rootStore);

    const { prevSteps } = authStore;

    const handleBackClick = async () => {
        await authStore.resetPasswords();
        await authStore.resetCode();

        if (prevSteps.length === 0) {
            await authStore.showAuthorizationScreen();
        }

        const prevStep = prevSteps.pop();
        if (!prevStep) {
            await authStore.showAuthorizationScreen();
            return;
        }

        authStore.resetRequestProcessionState();
        authStore.switchStep(prevStep);
    };

    return (
        <IconButton
            name="back"
            className="button--back"
            onClick={handleBackClick}
        />
    );
};
