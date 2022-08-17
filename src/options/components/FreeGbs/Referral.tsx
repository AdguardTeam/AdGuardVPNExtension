import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';
import { rootStore } from '../../stores';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { REQUEST_STATUSES } from '../../stores/consts';

const REFERRAL_RECEIVE_GB = 1;

export const Referral = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

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

    const statusMessage = invitesCount < maxInvitesCount
        ? reactTranslator.getMessage(
            'settings_referral_invited_friends',
            {
                count: invitesCount,
                limit: maxInvitesCount,
            },
        )
        : reactTranslator.getMessage('settings_referral_limit_reached', {
            your_gb: maxInvitesCount,
            friend_gb: REFERRAL_RECEIVE_GB,
        });

    const handleCopyLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await navigator.clipboard.writeText(inviteUrl);
        notificationsStore.notifySuccess(reactTranslator.getMessage('settings_referral_link_copied'));
    };

    return (
        <div>
            {referralDataRequestStatus !== REQUEST_STATUSES.DONE ? <DotsLoader />
                : (
                    <div>
                        <button
                            className="free-gbs__back-button"
                            type="button"
                            onClick={goBackHandler}
                        >
                            <svg className="icon icon--button">
                                <use xlinkHref="#arrow" />
                            </svg>
                        </button>
                        <div className="free-gbs__picture free-gbs__referral-pic" />
                        <Title title={reactTranslator.getMessage('settings_free_gbs_invite_friend')} />
                        <div className="free-gbs__info">
                            {reactTranslator.getMessage('settings_referral_info', {
                                your_gb: REFERRAL_RECEIVE_GB,
                                total_gb: maxInvitesCount,
                                friend_gb: REFERRAL_RECEIVE_GB,
                            })}
                        </div>
                        <div className="free-gbs__referral-status">
                            {statusMessage}
                        </div>
                        <form
                            className="free-gbs__referral-link"
                            onSubmit={handleCopyLink}
                        >
                            <label>
                                Invite link
                                <input
                                    type="text"
                                    id="referral-link"
                                    value={inviteUrl}
                                    disabled
                                />
                            </label>
                            <button
                                type="submit"
                                className="button button--large button--primary"
                            >
                                {reactTranslator.getMessage('settings_referral_copy_link')}
                            </button>
                        </form>
                    </div>
                )}
        </div>
    );
});
