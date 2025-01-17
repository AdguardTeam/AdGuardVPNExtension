import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { translator } from '../../../common/translator';
import { reactTranslator } from '../../../common/reactTranslator';
import { SubscriptionType } from '../../../common/constants';
import { getForwarderUrl } from '../../../common/helpers';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { Button } from '../ui/Button';

import { Features } from './Features';

import './account.pcss';

export const Account = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const {
        currentUsername,
        isPremiumToken,
        premiumFeatures,
        subscriptionType,
        subscriptionTimeExpiresIso,
        forwarderDomain,
    } = settingsStore;
    const { maxDevicesCount } = authStore;

    const editAccountUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.EDIT_ACCOUNT);

    const showGetSubscriptionButton = !isPremiumToken && !premiumFeatures;

    const handleSignOut = async (): Promise<void> => {
        await authStore.deauthenticate();
    };

    const handleHideFeatures = async (): Promise<void> => {
        await settingsStore.hidePremiumFeatures();
    };

    const handleUpgrade = async (): Promise<void> => {
        await settingsStore.openPremiumPromoPage();
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

    const getAccountType = (): React.ReactNode => {
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
            <Title
                title={translator.getMessage('account_title')}
                subtitle={(
                    <div className="account__description">
                        <div className="account__info">
                            {getAccountType()}
                        </div>
                        {expiresDate && isPremiumToken && (
                            <div className="account__info">
                                {reactTranslator.getMessage('account_valid_until', {
                                    date: expiresDate,
                                    b: (chunks: any) => (
                                        <b>{chunks}</b>
                                    ),
                                })}
                            </div>
                        )}
                        {maxDevicesCount !== undefined && (
                            <div className="account__info">
                                {reactTranslator.getMessage('account_max_devices_count', {
                                    num: maxDevicesCount,
                                    b: (chunks: any) => (
                                        <b>{chunks}</b>
                                    ),
                                })}
                            </div>
                        )}
                        <div className="account__info">
                            {reactTranslator.getMessage('account_logged_in_as', {
                                username: currentUsername,
                                b: (chunks: any) => (
                                    <b>{chunks}</b>
                                ),
                            })}
                        </div>
                    </div>
                )}
            />
            <div className="account__actions">
                {showGetSubscriptionButton && (
                    <Button className="account__action" onClick={handleUpgrade}>
                        {translator.getMessage('account_get_subscription')}
                    </Button>
                )}
                <a
                    href={editAccountUrl}
                    className="button button--medium button--outlined account__action"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <span className="button__text">
                        {translator.getMessage('account_edit')}
                    </span>
                </a>
                <Button
                    variant="outlined"
                    color="danger"
                    className="account__action"
                    onClick={handleSignOut}
                >
                    {translator.getMessage('account_sign_out')}
                </Button>
            </div>
            {!isPremiumToken && premiumFeatures && (
                <div className="account__features">
                    <Features />
                    <div className="account__actions account__actions--features">
                        <Button className="account__action" onClick={handleUpgrade}>
                            {translator.getMessage('account_get_subscription')}
                        </Button>
                        <Button className="account__action" variant="outlined" onClick={handleHideFeatures}>
                            {translator.getMessage('rate_hide')}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
});
