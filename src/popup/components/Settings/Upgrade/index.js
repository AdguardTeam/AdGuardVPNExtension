import React from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';

const Upgrade = ({ premiumPromoPage }) => (
    <div className="global-error global-error--upgrade">
        <div className="global-error__content">
            <div className="global-error__icon global-error__icon--error" />
                <div className="global-error__title">
                    {reactTranslator.translate('settings_vpn_disabled')}
                </div>
            <div className="global-error__description">
                {reactTranslator.translate('settings_run_out_data')}
            </div>
            <div className="global-error__info">
                {reactTranslator.translate('settings_run_upgrade_feature')}
            </div>
        </div>
        <div className="global-error__actions">
            <a href={premiumPromoPage} target="_blank" rel="noopener noreferrer" className="button button--medium button--green global-error__button">
                {reactTranslator.translate('premium_upgrade')}
            </a>
        </div>
    </div>
);

export default Upgrade;
