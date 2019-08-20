import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

    if (!settingsStore.isWhitelisted) {
        return null;
    }

    const getSiteUrl = () => settingsStore.currentTabUrl;

    const removeFromWhitelist = async () => {
        await settingsStore.removeFromWhitelist();
    };

    return (
        <Modal
            isOpen
            shouldCloseOnOverlayClick
            className="site-info"
            overlayClassName="site-info__overlay"
        >
            <div className="site">{getSiteUrl()}</div>
            <div className="message">is whitelisted</div>
            <div className="actions">
                You can
                <button onClick={removeFromWhitelist}>remove it from whitelist</button>
                {' '}
                or just switch on VPN once
            </div>
        </Modal>
    );
});

export default SiteInfo;
