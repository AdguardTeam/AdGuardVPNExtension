import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

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
                    is located in your local network and unaccessible via VPN
                </div>
                <div className="popup-info__desc">
                    You can
                    &nbsp;
                    {/* eslint-disable-next-line max-len */}
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid,jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
                    <a
                        type="button"
                        className="button popup-info__link"
                        onClick={removeFromWhitelist}
                    >
                        add the site to exclusions
                    </a>
                    &nbsp;
                    or switch off the VPN
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
                <div className="popup-info__status popup-info__status--succeed">added to exclusions</div>
                <div className="popup-info__desc">
                    You can &nbsp;
                    {/* eslint-disable-next-line max-len */}
                    {/* eslint-disable-next-line jsx-a11y/anchor-is-valid,jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
                    <a
                        type="button"
                        className="button popup-info__link"
                        onClick={removeFromWhitelist}
                    >
                        remove it from exclusions
                    </a>
                </div>
            </Modal>
        );
    }

    return null;
});

export default SiteInfo;
