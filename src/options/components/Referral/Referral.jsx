import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';

import './referral.pcss';
import { Title } from '../ui/Title';
import { rootStore } from '../../stores';

export const Referral = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        referralLink,
        referralPartners: invitedFriends,
    } = settingsStore;

    const getStatusMessage = () => {
        return (
            <>
                {`${reactTranslator.getMessage('settings_referral_invited_friends')} ${invitedFriends}/10`}
            </>
        );
    };

    const handleCopyLink = async (e) => {
        e.preventDefault();
        await navigator.clipboard.writeText(referralLink);
    };

    return (
        <div className="referral">
            <img
                src="../../../assets/images/free-traffic.svg"
                className="referral__image"
                alt="Get free traffic"
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
            </form>
        </div>
    );
});
