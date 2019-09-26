import React, { useContext } from 'react';
import Modal from 'react-modal';
import './preloader.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../stores';

const ExtraOptions = observer(() => {
    const { authStore } = useContext(rootStore);

    return (
        <Modal
            isOpen={authStore.state === 'pending'}
            className="preloader"
            overlayClassName="preloader__overlay"
        >
            <div className="preloader__in" />
        </Modal>
    );
});

export default ExtraOptions;
