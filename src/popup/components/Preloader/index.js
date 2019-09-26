import React, { useContext } from 'react';
import Modal from 'react-modal';
import './preloader.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import { REQUEST_STATUSES } from '../../stores/consts';

const ExtraOptions = observer(() => {
    const { authStore } = useContext(rootStore);

    return (
        <Modal
            isOpen={authStore.state === REQUEST_STATUSES.PENDING}
            className="preloader"
            overlayClassName="preloader__overlay"
        >
            <div className="preloader__in" />
        </Modal>
    );
});

export default ExtraOptions;
