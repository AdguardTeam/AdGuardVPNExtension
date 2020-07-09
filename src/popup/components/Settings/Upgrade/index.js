import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import rootStore from '../../../stores';

const Upgrade = observer(() => {
    const { vpnStore } = useContext(rootStore);

    const upgradeClickHandler = async (e) => {
        e.preventDefault();
        await vpnStore.openPremiumPromoPage();
    };

    return (
        <div className="global-error global-error--upgrade">
            <div className="global-error__content">
                <div className="global-error__icon global-error__icon--error" />
                    <div className="global-error__title">
                        {reactTranslator.translate('settings_vpn_disabled')}
                    </div>
                <div className="global-error__description">
                    {reactTranslator.translate('settings_run_out_data')}
                </div>
            </div>
            <div className="global-error__actions">
                <a
                    className="button button--medium button--green-gradient global-error__button"
                    onClick={upgradeClickHandler}
                >
                    {reactTranslator.translate('premium_upgrade')}
                </a>
            </div>
        </div>
    );
});

export default Upgrade;
