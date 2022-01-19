import React, { useContext, useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';
import { rootStore } from '../../stores';
import DotsLoader from '../../../popup/components/ui/DotsLoader';
import { REQUEST_STATUSES } from '../../stores/consts';

import './referral.pcss';

const REFERRAL_LINK_MESSAGE_DISPLAY_TIME = 2000;

export const Referral = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        inviteUrl,
        invitesCount,
        maxInvitesCount,
        referralDataRequestStatus,
    } = settingsStore;

    useEffect(() => {
        (async () => {
            await settingsStore.updateReferralData();
        })();
    }, []);

    const getStatusMessage = () => {
        const statusMessage = invitesCount < maxInvitesCount
            ? reactTranslator.getMessage(
                'settings_referral_invited_friends',
                {
                    count: invitesCount,
                    limit: maxInvitesCount,
                },
            )
            : reactTranslator.getMessage('settings_referral_limit_reached');
        return (
            <div>
                {statusMessage}
            </div>
        );
    };

    const [displayLinkMessage, setDisplayLinkMessage] = useState(false);

    const handleCopyLink = async (e) => {
        e.preventDefault();
        await navigator.clipboard.writeText(inviteUrl);
        setDisplayLinkMessage(true);

        setTimeout(() => {
            setDisplayLinkMessage(false);
        }, REFERRAL_LINK_MESSAGE_DISPLAY_TIME);
    };

    const referralLinkMessageClasses = classnames(
        'referral__link__message',
        { referral__link__message__display: displayLinkMessage },
    );

    return (
        <div>
            {referralDataRequestStatus !== REQUEST_STATUSES.DONE ? <DotsLoader />
                : (
                    <div className="referral">
                        <Title title={reactTranslator.getMessage('referral_get_free_traffic')} />
                        <div className="referral__info">
                            {reactTranslator.getMessage('settings_referral_info')}
                        </div>
                        <div className="referral__status">
                            {getStatusMessage()}
                        </div>
                        <form
                            className="referral__link"
                            onSubmit={handleCopyLink}
                        >
                            <input
                                type="text"
                                id="referral-link"
                                className="referral__link__input"
                                value={inviteUrl}
                                disabled
                            />
                            <input
                                type="submit"
                                className="referral__link__copy-button"
                                value={reactTranslator.getMessage('settings_referral_copy_link')}
                            />
                            <span className={referralLinkMessageClasses}>
                                {reactTranslator.getMessage('settings_referral_link_copied')}
                            </span>
                        </form>
                    </div>
                )}
        </div>
    );
});
