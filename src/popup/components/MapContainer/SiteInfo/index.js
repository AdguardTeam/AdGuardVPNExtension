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
            className="popup-info__in"
            overlayClassName="popup-info"
        >
            <div className="popup-info__title popup-info__title--domain">{getSiteUrl()}</div>
            <div className="popup-info__status popup-info__status--succeed">is whitelisted</div>
            <div className="popup-info__desc">
                You can
                <button className="button popup-info__link" onClick={removeFromWhitelist}>remove it from whitelist</button>
                {' '}
                or just switch on VPN once
            </div>
        </Modal>
    );
});

export default SiteInfo;
