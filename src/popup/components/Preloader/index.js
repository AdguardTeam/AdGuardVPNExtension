import React, { useContext } from 'react';
import Modal from 'react-modal';
import './preloader.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../stores';

const ExtraOptions = observer(() => {
    const { uiStore } = useContext(rootStore);

    return (
        <Modal
            isOpen={uiStore.isOpenPreloaderModal}
            className="preloader"
            overlayClassName="preloader__overlay"
        >
            <div className="preloader__in" />
        </Modal>
    );
});

export default ExtraOptions;
