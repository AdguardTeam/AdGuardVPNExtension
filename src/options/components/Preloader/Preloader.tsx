import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import Modal from 'react-modal';

import { rootStore } from '../../stores';
import { RequestStatus } from '../../stores/consts';

import './preloader.pcss';

export const Preloader = observer(() => {
    const { authStore, globalStore } = useContext(rootStore);

    const isOpen = globalStore.status === RequestStatus.Pending
        || authStore.requestProcessState === RequestStatus.Pending;

    return (
        <Modal
            isOpen={isOpen}
            className="preloader"
            overlayClassName="preloader__overlay"
        >
            <div className="preloader__in" />
        </Modal>
    );
});
