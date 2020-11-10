import React from 'react';
import Modal from 'react-modal';
import './preloader.pcss';
import { observer } from 'mobx-react';

const Preloader = observer(({ isOpen }) => {
    return (
        <Modal
            isOpen={isOpen}
            className="preloader"
            overlayClassName="preloader__overlay"
        />
    );
});

export default Preloader;
