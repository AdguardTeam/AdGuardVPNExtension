import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import { translator } from '../../../common/translator';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { rootStore } from '../../stores';
import { RequestStatus, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Title } from '../ui/Title';

import { FreeGbsButton } from './FreeGbsButton';
import { InviteFriend, ConfirmEmail, AddDevice } from './FreeGbsTasks';

import './free-gbs.pcss';

const FREE_GBS = 'free-gbs';
const INVITE_FRIEND = 'invite-friend';
const CONFIRM_EMAIL = 'confirm-email';
const ADD_DEVICE = 'add-device';

export const FreeGbs = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const history = useHistory();
    const { search } = useLocation();

    const {
        invitesBonuses,
        bonusesDataRequestStatus,
        invitesQuestCompleted,
        confirmEmailQuestCompleted,
        addDeviceQuestCompleted,
    } = settingsStore;

    const { invitesCount, maxInvitesCount } = invitesBonuses;
    const inviteFriendTitle = `${translator.getMessage('settings_free_gbs_invite_friend')} (${invitesCount}/${maxInvitesCount})`;
    const itemsData = [
        {
            title: inviteFriendTitle,
            description: translator.getMessage('settings_free_gbs_invite_friend_get_GB', { num: maxInvitesCount }),
            doneDescription: translator.getMessage('settings_free_gbs_invite_friend_complete', { num: maxInvitesCount }),
            query: INVITE_FRIEND,
            isDone: invitesQuestCompleted,
        },
        {
            title: translator.getMessage('settings_free_gbs_confirm_email_title'),
            description: translator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            doneDescription: translator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: CONFIRM_EMAIL,
            isDone: confirmEmailQuestCompleted,
        },
        {
            title: translator.getMessage('settings_free_gbs_add_device_title'),
            description: translator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            doneDescription: translator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: ADD_DEVICE,
            isDone: addDeviceQuestCompleted,
        },
    ];

    const query = new URLSearchParams(search);

    const handleGoBackClick = () => {
        history.push(`/${FREE_GBS}`);
    };

    const handleButtonClick = (query: string) => {
        history.push(`/${FREE_GBS}?${query}`);
    };

    useEffect(() => {
        (async () => {
            await settingsStore.updateBonusesData();
        })();
    }, []);

    if (bonusesDataRequestStatus !== RequestStatus.Done) {
        return <DotsLoader />;
    }

    if (query.has(INVITE_FRIEND)) {
        return <InviteFriend onBackClick={handleGoBackClick} />;
    }

    if (query.has(CONFIRM_EMAIL)) {
        return <ConfirmEmail onBackClick={handleGoBackClick} />;
    }

    if (query.has(ADD_DEVICE)) {
        return <AddDevice onBackClick={handleGoBackClick} />;
    }

    return (
        <>
            <Title
                title={translator.getMessage('settings_free_gbs')}
                subtitle={translator.getMessage('settings_free_gbs_subtitle')}
            />
            {itemsData.map((item) => (
                <FreeGbsButton
                    key={item.query}
                    title={item.title}
                    description={item.description}
                    doneDescription={item.doneDescription}
                    isDone={item.isDone}
                    query={item.query}
                    onClick={handleButtonClick}
                />
            ))}
        </>
    );
});
