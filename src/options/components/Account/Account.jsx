import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { EDIT_ACCOUNT_URL } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';
import { Features } from './Features/Features';

import './account.pcss';

export const Account = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const {
        currentUsername,
        isPremiumToken,
        premiumFeatures,
        hidePremiumFeatures,
        openPremiumPromoPage,
        nextBillDate,
    } = settingsStore;

    const signOut = async () => {
        await authStore.deauthenticate();
    };

    const hideFeatures = async () => {
        await hidePremiumFeatures();
    };

    const upgrade = async () => {
        await openPremiumPromoPage();
    };

    let billDate;

    if (nextBillDate) {
        const dateObj = new Date(nextBillDate);

        const formatOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        };

        billDate = dateObj.toLocaleDateString('default', formatOptions);
    }

    return (
        <>
            <Title title={reactTranslator.getMessage('account_title')} />
            <div className="account">
                <div className="account__info">
                    <div className="account__name">
                        {reactTranslator.getMessage('account_version')}
                    </div>
                    <div className="account__desc">
                        {isPremiumToken
                            ? reactTranslator.getMessage('account_unlimited')
                            : reactTranslator.getMessage('account_free')}
                        {billDate && (
                            ` ${reactTranslator.getMessage('account_next_charge', { date: billDate })}`
                        )}
                    </div>
                </div>
                <div className="account__info">
                    <div className="account__name">
                        {reactTranslator.getMessage('account_signed')}
                    </div>
                    <div className="account__desc">
                        {currentUsername}
                    </div>
                </div>
                <div className="account__actions">
                    <a
                        href={EDIT_ACCOUNT_URL}
                        className="button button--medium button--outline-gray account__action"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {reactTranslator.getMessage('account_edit')}
                    </a>
                    <button
                        type="button"
                        className="button button--medium button--outline-red account__action"
                        onClick={signOut}
                    >
                        {reactTranslator.getMessage('account_sign_out')}
                    </button>
                </div>
                {(!isPremiumToken && premiumFeatures) && (
                    <div className="account__features">
                        <Features />
                        <div className="account__actions">
                            <button
                                type="button"
                                className="button button--medium button--primary account__action"
                                onClick={upgrade}
                            >
                                {reactTranslator.getMessage('premium_upgrade')}
                            </button>
                            <button
                                type="button"
                                className="button button--medium button--outline-gray account__action"
                                onClick={hideFeatures}
                            >
                                {reactTranslator.getMessage('rate_hide')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});
