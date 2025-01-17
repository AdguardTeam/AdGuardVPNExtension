import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { RequestStatus } from '../../stores/consts';

import './preloader.pcss';

export const Preloader = observer(() => {
    const { authStore, globalStore } = useContext(rootStore);

    const isOpen = globalStore.status === RequestStatus.Pending
        || authStore.requestProcessState === RequestStatus.Pending;

    if (!isOpen) {
        return null;
    }

    return (
        <div className="preloader">
            <div className="preloader__in" />
        </div>
    );
});
