import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { DotsLoader } from '../../../common/components/DotsLoader';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { RequestStatus, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';

export const InviteFriend = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const { invitesBonuses, bonusesDataRequestStatus } = settingsStore;
    const { invitesCount, maxInvitesCount, inviteUrl } = invitesBonuses;

    const isCompleted = invitesCount >= maxInvitesCount;

    const title = translator.getMessage('settings_free_gbs_invite_friend');

    const description = isCompleted
        ? translator.getMessage('settings_free_gbs_invite_friend_completed_thank_you')
        : translator.getMessage('settings_referral_info', {
            your_gb: COMPLETE_TASK_BONUS_GB,
            total_gb: maxInvitesCount,
            friend_gb: COMPLETE_TASK_BONUS_GB,
        });

    useEffect(() => {
        (async () => {
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const handleCopyLink = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await navigator.clipboard.writeText(inviteUrl);
        notificationsStore.notifySuccess(translator.getMessage('settings_referral_link_copied'));
    };

    if (bonusesDataRequestStatus !== RequestStatus.Done) {
        return <DotsLoader />;
    }

    return (
        <div className="free-gbs-task">
            <Title title="" onClick={goBackHandler} />
            <img
                src="../../../assets/images/referral.svg"
                alt={title}
                className="free-gbs-task__image"
            />
            <Title
                title={title}
                subtitle={description}
                className="free-gbs-task__title"
            />
            <div className="free-gbs-task__content invite-friend">
                {!isCompleted ? (
                    <form
                        className="invite-friend__content"
                        onSubmit={handleCopyLink}
                    >
                        <Input
                            label={translator.getMessage('settings_referral_invite_link')}
                            value={inviteUrl}
                            readOnly
                        />
                        <Button
                            type="submit"
                            size="medium"
                            className="invite-friend__btn"
                        >
                            {translator.getMessage('settings_referral_copy_link')}
                        </Button>
                    </form>
                ) : (
                    <Button
                        variant="outlined"
                        size="medium"
                        onClick={goBackHandler}
                        className="free-gbs-task__go-back-btn"
                    >
                        {translator.getMessage('settings_free_gbs_go_back')}
                    </Button>
                )}
                <div className="invite-friend__counter">
                    {translator.getMessage('settings_referral_invited_friends', {
                        count: invitesCount,
                        limit: maxInvitesCount,
                    })}
                </div>
            </div>
        </div>
    );
});
