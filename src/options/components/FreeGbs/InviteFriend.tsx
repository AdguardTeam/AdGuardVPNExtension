import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';

export const InviteFriend = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const { invitesCount, maxInvitesCount, inviteUrl } = settingsStore.invitesBonuses;

    const isCompleted = invitesCount >= maxInvitesCount;

    const description = isCompleted
        ? translator.getMessage('settings_free_gbs_invite_friend_completed_thank_you')
        : translator.getMessage('settings_referral_info', {
            your_gb: COMPLETE_TASK_BONUS_GB,
            total_gb: maxInvitesCount,
            friend_gb: COMPLETE_TASK_BONUS_GB,
        });

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(inviteUrl);
        notificationsStore.notifySuccess(
            translator.getMessage('settings_referral_link_copied'),
        );
    };

    return (
        <div className="free-gbs-task">
            <img
                src="../../../assets/images/referral.svg"
                alt="Invite friend task"
                className="free-gbs-task__image"
            />
            <Title
                title={translator.getMessage('settings_free_gbs_invite_friend')}
                subtitle={description}
            />
            <div className="free-gbs-task__content invite-friend">
                {!isCompleted ? (
                    <div className="invite-friend__content">
                        <Input
                            label={translator.getMessage('settings_referral_invite_link')}
                            value={inviteUrl}
                            readOnly
                        />
                        <Button
                            size="medium"
                            className="invite-friend__btn"
                            onClick={handleCopyLink}
                        >
                            {translator.getMessage('settings_referral_copy_link')}
                        </Button>
                    </div>
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
