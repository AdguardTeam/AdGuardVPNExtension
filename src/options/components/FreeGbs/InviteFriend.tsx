import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { DotsLoader } from '../../../common/components/DotsLoader';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import referralImageUrl from '../../../assets/images/referral.svg';
import { rootStore } from '../../stores';
import { RequestStatus, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';

/**
 * Invite friend page component.
 */
export const InviteFriend = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.FreeGbInviteFriendScreen,
    );

    const { invitesBonuses, bonusesDataRequestStatus } = settingsStore;
    const { invitesCount, maxInvitesCount, inviteUrl } = invitesBonuses;

    const isCompleted = invitesCount >= maxInvitesCount;

    const title = isCompleted
        ? translator.getMessage('settings_free_gbs_invite_friend_title_success', {
            total_invites: invitesCount,
            total_gbs: maxInvitesCount * COMPLETE_TASK_BONUS_GB,
        })
        : translator.getMessage('settings_free_gbs_invite_friend_title', { your_gb: COMPLETE_TASK_BONUS_GB });

    const description = isCompleted
        ? translator.getMessage('settings_free_gbs_invite_friend_completed_thank_you')
        : translator.getMessage('settings_referral_info', {
            your_gb: COMPLETE_TASK_BONUS_GB,
            max_friends: maxInvitesCount,
            total_gb: maxInvitesCount * COMPLETE_TASK_BONUS_GB,
        });

    useEffect(() => {
        (async (): Promise<void> => {
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const handleCopyLink = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CopyLinkClick,
            TelemetryScreenName.FreeGbInviteFriendScreen,
        );
        await navigator.clipboard.writeText(inviteUrl);
        notificationsStore.notifySuccess(translator.getMessage('settings_referral_link_copied'));
    };

    if (bonusesDataRequestStatus !== RequestStatus.Done) {
        return <DotsLoader />;
    }

    const handleUpgrade = async (): Promise<void> => {
        await settingsStore.openPremiumPromoPage();
    };

    return (
        <div className="free-gbs-task">
            <Title
                className="free-gbs-task__back"
                title=""
                onClick={goBackHandler}
            />
            <img
                src={referralImageUrl}
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
                        variant="filled"
                        size="medium"
                        onClick={handleUpgrade}
                        className="free-gbs-task__upgrade-btn"
                    >
                        {translator.getMessage('settings_free_gbs_upgrade')}
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
