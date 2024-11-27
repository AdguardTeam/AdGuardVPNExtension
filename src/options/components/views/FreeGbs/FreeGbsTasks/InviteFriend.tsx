import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../../../stores/consts';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';

import { type BaseProps, FreeGbsTask } from './FreeGbsTask';

export const InviteFriend = observer(({ onBackClick }: BaseProps) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const { invitesCount, maxInvitesCount, inviteUrl } = settingsStore.invitesBonuses;

    const isCompleted = invitesCount >= maxInvitesCount;

    const description = isCompleted
        ? reactTranslator.getMessage('settings_free_gbs_invite_friend_completed_thank_you')
        : reactTranslator.getMessage('settings_referral_info', {
            your_gb: COMPLETE_TASK_BONUS_GB,
            total_gb: maxInvitesCount,
            friend_gb: COMPLETE_TASK_BONUS_GB,
        });

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(inviteUrl);
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('settings_referral_link_copied'),
        );
    };

    return (
        <FreeGbsTask
            imageName="referral"
            title={reactTranslator.getMessage('settings_free_gbs_invite_friend')}
            description={description}
            contentClassName="invite-friend"
            completed={isCompleted}
            onBackClick={onBackClick}
        >
            <div className="invite-friend__content">
                <Input
                    label={reactTranslator.getMessage('settings_referral_invite_link')}
                    value={inviteUrl}
                    readOnly
                />
                <Button onClick={handleCopyLink}>
                    {reactTranslator.getMessage('settings_referral_copy_link')}
                </Button>
            </div>
            <div className="invite-friend__counter">
                {reactTranslator.getMessage('settings_referral_invited_friends', {
                    count: invitesCount,
                    limit: maxInvitesCount,
                })}
            </div>
        </FreeGbsTask>
    );
});
