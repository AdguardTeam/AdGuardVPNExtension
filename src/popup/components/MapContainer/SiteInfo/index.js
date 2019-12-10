import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

const SiteInfo = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { canBeExcluded } = settingsStore;

    const addToExclusions = async () => {
        await settingsStore.addToExclusions();
    };

    const removeFromExclusions = async () => {
        await settingsStore.removeFromExclusions();
    };

    if (settingsStore.displayNonRoutable) {
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
                    <a
                        type="button"
                        className="button popup-info__link"
                        onClick={addToExclusions}
                    >
                        add the website to exclusions
                    </a>
                    &nbsp;
                    or switch off the VPN
                </div>
            </Modal>
        );
    }

    if (!settingsStore.isExcluded && settingsStore.areExclusionsInverted() && canBeExcluded) {
        return (
            <Modal
                isOpen
                shouldCloseOnOverlayClick
                className="popup-info__in"
                overlayClassName="popup-info"
            >
                <div className="popup-info__title popup-info__title--domain">{settingsStore.currentTabHostname}</div>
                <div className="popup-info__status popup-info__status--warning">VPN is disabled on this website</div>
                <div className="popup-info__desc">
                    You can &nbsp;
                    <a
                        type="button"
                        className="button popup-info__link"
                        onClick={addToExclusions}
                    >
                        enable VPN on this website
                    </a>
                </div>
            </Modal>
        );
    }

    if (settingsStore.isExcluded && !settingsStore.areExclusionsInverted()) {
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
                    <a
                        type="button"
                        className="button popup-info__link"
                        onClick={removeFromExclusions}
                    >
                        enable VPN on this website
                    </a>
                </div>
            </Modal>
        );
    }

    return null;
});

export default SiteInfo;
