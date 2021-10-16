import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';
import { rootStore } from '../../stores';

import './referral.pcss';

const REFERRAL_PARTNERS_LIMIT = 10;
const REFERRAL_LINK_MESSAGE_TIMEOUT = 2000;

export const Referral = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        referralLink,
        referralPartners,
    } = settingsStore;

    const getStatusMessage = () => {
        const statusMessage = referralPartners < REFERRAL_PARTNERS_LIMIT
            ? `${reactTranslator.getMessage('settings_referral_invited_friends')} ${referralPartners}/${REFERRAL_PARTNERS_LIMIT}`
            : reactTranslator.getMessage('settings_referral_limit_reached');
        return (
            <>
                {statusMessage}
            </>
        );
    };

    const [displayLinkMessage, setDisplayLinkMessage] = useState(false);

    const handleCopyLink = async (e) => {
        e.preventDefault();
        await navigator.clipboard.writeText(referralLink);
        setDisplayLinkMessage(true);

        setTimeout(() => {
            setDisplayLinkMessage(false);
        }, REFERRAL_LINK_MESSAGE_TIMEOUT);
    };

    const referralLinkMessageClasses = classnames(
        'referral__link__message',
        { referral__link__message__display: displayLinkMessage },
    );

    return (
        <div className="referral">
            <img
                src="../../../assets/images/free-traffic.svg"
                className="referral__image"
                alt={reactTranslator.getMessage('referral_get_free_traffic')}
            />
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
                    value={referralLink}
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
    );
});
