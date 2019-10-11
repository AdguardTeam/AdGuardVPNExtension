import React, { useContext, useEffect } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await settingsStore.isTabRoutable();
        })();
    }, []);

    const removeFromWhitelist = async () => {
        await settingsStore.removeFromWhitelist();
    };

    if (!settingsStore.isRoutable) {
        return (
            <Modal
                isOpen
                shouldCloseOnOverlayClick
                className="popup-info__in"
                overlayClassName="popup-info"
            >
                <div className="popup-info__title popup-info__title--domain">{settingsStore.currentTabHostname}</div>
                <div className="popup-info__status popup-info__status--warning">
                    that seems to be located in your local network and is not accessible through VPN
                </div>
                <div className="popup-info__desc">
                    You can
                    &nbsp;
                    <button
                        type="button"
                        className="button popup-info__link"
                        onClick={removeFromWhitelist}
                    >
                        remove it from whitelist
                    </button>
                    &nbsp;
                    or just switch on VPN once
                </div>
                <div className="popup-info__desc">
                    <button
                        type="button"
                        className="button popup-info__link"
                        onClick={() => { console.log('Don’t remind me about this site'); }}
                    >
                        Don’t remind me about this site
                    </button>
                </div>
            </Modal>
        );
    }

    if (settingsStore.isWhitelisted) {
        return (
            <Modal
                isOpen
                shouldCloseOnOverlayClick
                className="popup-info__in"
                overlayClassName="popup-info"
            >
                <div className="popup-info__title popup-info__title--domain">{settingsStore.currentTabHostname}</div>
                <div className="popup-info__status popup-info__status--succeed">is whitelisted</div>
                <div className="popup-info__desc">
                    You can
                    &nbsp;
                    <button
                        type="button"
                        className="button popup-info__link"
                        onClick={removeFromWhitelist}
                    >
                        remove it from whitelist
                    </button>
                    &nbsp;
                    or just switch on VPN once
                </div>
            </Modal>
        );
    }

    return null;
});

export default SiteInfo;
