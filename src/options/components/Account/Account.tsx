import React, { ReactNode, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { EDIT_ACCOUNT_URL } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';
import { Features } from './Features/Features';

import './account.pcss';

enum SubscriptionType {
    Monthly = 'MONTHLY',
    Yearly = 'YEARLY',
    TwoYears = 'TWO_YEARS',
}

export const Account = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const {
        currentUsername,
        isPremiumToken,
        premiumFeatures,
        hidePremiumFeatures,
        openPremiumPromoPage,
        nextBillDate,
        subscriptionType,
    } = settingsStore;

    const { maxDevicesCount } = authStore;

    const signOut = async (): Promise<void> => {
        await authStore.deauthenticate();
    };

    const hideFeatures = async (): Promise<void> => {
        await hidePremiumFeatures();
    };

    const upgrade = async (): Promise<void> => {
        await openPremiumPromoPage();
    };

    let billDate;

    if (nextBillDate) {
        const dateObj = new Date(nextBillDate);

        const formatOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        };

        billDate = dateObj.toLocaleDateString('default', formatOptions);
    }

    const subscriptionsMap = {
        [SubscriptionType.Monthly]: reactTranslator.getMessage('account_monthly_paid'),
        [SubscriptionType.Yearly]: reactTranslator.getMessage('account_yearly_paid'),
        [SubscriptionType.TwoYears]: reactTranslator.getMessage('account_two_year_paid'),
    };

    const getAccountType = (): ReactNode => {
        if (!isPremiumToken) {
            return reactTranslator.getMessage('account_free');
        }

        if (subscriptionType) {
            return subscriptionsMap[subscriptionType as SubscriptionType];
        }

        return reactTranslator.getMessage('account_unlimited');
    };

    return (
        <>
            <Title title={reactTranslator.getMessage('account_title')} />
            <div className="account">
                <div className="account__info">
                    <div className="account__name">
                        {currentUsername}
                    </div>
                    <div className="account__desc">
                        {getAccountType()}
                    </div>

                    {billDate && (
                        <div className="account__bill-date">
                            {reactTranslator.getMessage('account_next_charge', { date: billDate })}
                        </div>
                    )}
                    {maxDevicesCount !== undefined && (
                        <div className="account__max-devices">
                            {reactTranslator.getMessage('account_max_devices_count', { num: maxDevicesCount })}
                        </div>
                    )}
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
                                {reactTranslator.getMessage('account_get_subscription')}
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
