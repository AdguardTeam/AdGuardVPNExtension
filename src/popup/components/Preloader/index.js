import React, { useContext } from 'react';
import Modal from 'react-modal';
import './preloader.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import { REQUEST_STATUSES } from '../../stores/consts';

const Preloader = observer(() => {
    const { authStore, globalStore } = useContext(rootStore);

    const isOpen = globalStore.status === REQUEST_STATUSES.PENDING
        || authStore.requestProcessState === REQUEST_STATUSES.PENDING;

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

export default Preloader;
