import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import './info-message.pcss';
import rootStore from '../../stores';
import popupActions from '../../actions/popupActions';

const InfoMessage = observer(() => {
    const { vpnInfoStore } = useContext(rootStore);

    if (vpnInfoStore.premiumPromoEnabled) {
        return null;
    }

    const onClick = url => (e) => {
        e.preventDefault();
        popupActions.openTab(url);
    };

    return (
        <div className="info-message">
            <div className="info-message__info">
                Your speed is limited to
                <span className="info-message__mark">
                    &nbsp;
                    {vpnInfoStore.bandwidthFreeMbits}
                    &nbsp;
                    Mbits
                </span>
            </div>
            <a
                href={vpnInfoStore.premiumPromoPage}
                type="button"
                className="info-message__btn button button--orange"
                onClick={onClick(vpnInfoStore.premiumPromoPage)}
            >
                Lift the limit
            </a>
        </div>
    );
});

export default InfoMessage;
