import React, { type ReactNode, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { getForwarderUrl } from '../../../common/helpers';
import { reactTranslator } from '../../../common/reactTranslator';
import { translator } from '../../../common/translator';
import { SubscriptionType } from '../../../common/constants';

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
        subscriptionType,
        subscriptionTimeExpiresIso,
        forwarderDomain,
    } = settingsStore;

    const editAccountUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.EDIT_ACCOUNT);

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

    let expiresDate;

    if (subscriptionTimeExpiresIso) {
        const dateObj = new Date(subscriptionTimeExpiresIso);

        const formatOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        };

        expiresDate = dateObj.toLocaleDateString('default', formatOptions);
    }

    const subscriptionsMap = {
        [SubscriptionType.Monthly]: translator.getMessage('account_monthly_paid'),
        [SubscriptionType.Yearly]: translator.getMessage('account_yearly_paid'),
        [SubscriptionType.TwoYears]: translator.getMessage('account_two_year_paid'),
    };

    const getAccountType = (): ReactNode => {
        if (!isPremiumToken) {
            return translator.getMessage('account_free');
        }

        if (subscriptionType) {
            return subscriptionsMap[subscriptionType];
        }

        return translator.getMessage('account_unlimited');
    };

    return (
        <>
            <Title title={translator.getMessage('account_title')} />
            <div className="account">
                <div className="account__info">
                    <div className="account__info-item">
                        {getAccountType()}
                    </div>
                    {expiresDate && (
                        <div className="account__info-item">
                            {reactTranslator.getMessage('account_valid_until', {
                                date: expiresDate,
                                b: (chunks: any) => (
                                    <span className="account__info-item--bold">
                                        {chunks}
                                    </span>
                                ),
                            })}
                        </div>
                    )}
                    {maxDevicesCount !== undefined && (
                        <div className="account__info-item">
                            {reactTranslator.getMessage('account_max_devices_count', {
                                num: maxDevicesCount,
                                b: (chunks: any) => (
                                    <span className="account__info-item--bold">
                                        {chunks}
                                    </span>
                                ),
                            })}
                        </div>
                    )}
                    <div className="account__info-item">
                        {reactTranslator.getMessage('account_logged_in_as', {
                            username: currentUsername,
                            b: (chunks: any) => (
                                <span className="account__info-item--bold">
                                    {chunks}
                                </span>
                            ),
                        })}
                    </div>
                </div>
                <div className="account__actions">
                    <a
                        href={editAccountUrl}
                        className="button button--large button--outline-gray account__action"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {translator.getMessage('account_edit')}
                    </a>
                    <button
                        type="button"
                        className="button button--large button--outline-red account__action"
                        onClick={signOut}
                    >
                        {translator.getMessage('account_sign_out')}
                    </button>
                </div>
                {(!isPremiumToken && premiumFeatures) && (
                    <div className="account__features">
                        <Features />
                        <div className="account__actions">
                            <button
                                type="button"
                                className="button button--large button--primary account__action"
                                onClick={upgrade}
                            >
                                {translator.getMessage('account_get_subscription')}
                            </button>
                            <button
                                type="button"
                                className="button button--large button--outline-gray account__action"
                                onClick={hideFeatures}
                            >
                                {translator.getMessage('rate_hide')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
});
