import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';
import { rootStore } from '../../stores';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { REQUEST_STATUSES, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';

export const InviteFriend = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const { invitesBonuses, bonusesDataRequestStatus } = settingsStore;
    const { invitesCount, maxInvitesCount, inviteUrl } = invitesBonuses;

    useEffect(() => {
        (async () => {
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const handleCopyLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await navigator.clipboard.writeText(inviteUrl);
        notificationsStore.notifySuccess(reactTranslator.getMessage('settings_referral_link_copied'));
    };

    if (bonusesDataRequestStatus !== REQUEST_STATUSES.DONE) {
        return <DotsLoader />;
    }

    switch (true) {
        case bonusesDataRequestStatus !== REQUEST_STATUSES.DONE: {
            return <DotsLoader />;
        }
        case invitesCount >= maxInvitesCount: {
            return (
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
                    <Title title={reactTranslator.getMessage(
                        'settings_referral_invited_friends',
                        {
                            count: invitesCount,
                            limit: maxInvitesCount,
                        },
                    )}
                    />
                    <div className="free-gbs__info">{reactTranslator.getMessage('settings_free_gbs_invite_friend_completed_thank_you')}</div>
                    <button
                        type="button"
                        className="button button--large button--outline-gray free-gbs__button"
                        onClick={goBackHandler}
                    >
                        {reactTranslator.getMessage('settings_free_gbs_go_back')}
                    </button>
                </div>
            );
        }
        default: {
            return (
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
                            your_gb: COMPLETE_TASK_BONUS_GB,
                            total_gb: maxInvitesCount,
                            friend_gb: COMPLETE_TASK_BONUS_GB,
                        })}
                    </div>
                    <div className="free-gbs__referral-status">
                        {reactTranslator.getMessage(
                            'settings_referral_invited_friends',
                            {
                                count: invitesCount,
                                limit: maxInvitesCount,
                            },
                        )}
                    </div>
                    <form
                        className="free-gbs__referral-link"
                        onSubmit={handleCopyLink}
                    >
                        <label>
                            {reactTranslator.getMessage('settings_referral_invite_link')}
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
            );
        }
    }
});
