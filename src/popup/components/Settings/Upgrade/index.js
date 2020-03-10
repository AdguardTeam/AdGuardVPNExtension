import React from 'react';
import translator from '../../../../lib/translator';

const Upgrade = () => (
    <div className="global-error global-error--upgrade">
        <div className="global-error__content">
            <div className="global-error__icon global-error__icon--error" />
                <div className="global-error__title">
                    {translator.translate('settings_vpn_disabled')}
                </div>
            <div className="global-error__description">
                {translator.translate('settings_run_out_data')}
            </div>
        </div>
        <div className="global-error__actions">
            <a className="button button--medium button--green-gradient global-error__button">
                {translator.translate('premium_upgrade')}
            </a>
        </div>
    </div>
);

export default Upgrade;
