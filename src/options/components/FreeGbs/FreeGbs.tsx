import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import classNames from 'classnames';

import { translator } from '../../../common/translator';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { rootStore } from '../../stores';
import { RequestStatus, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Title } from '../ui/Title';
import { Controls } from '../ui/Controls';
import { Icon, IconButton } from '../ui/Icon';

import { InviteFriend } from './InviteFriend';
import { ConfirmEmail } from './ConfirmEmail';
import { AddDevice } from './AddDevice';

import './free-gbs.pcss';

interface RenderItemProps {
    title: string;
    status: string | React.ReactNode;
    query: string;
    statusDone: string | React.ReactNode;
    completed: boolean;
}

const FREE_GBS = 'free-gbs';
const INVITE_FRIEND = 'invite-friend';
const CONFIRM_EMAIL = 'confirm-email';
const ADD_DEVICE = 'add-device';

export const FreeGbs = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await settingsStore.updateBonusesData();
        })();
    }, []);

    const {
        invitesBonuses,
        bonusesDataRequestStatus,
        invitesQuestCompleted,
        confirmEmailQuestCompleted,
        addDeviceQuestCompleted,
    } = settingsStore;

    const { invitesCount, maxInvitesCount } = invitesBonuses;

    const history = useHistory();
    const { search } = useLocation();
    const query = new URLSearchParams(search);

    const goBackHandler = () => {
        history.push(`/${FREE_GBS}`);
    };

    const clickItemHandler = (query: string) => {
        history.push(`/${FREE_GBS}?${query}`);
    };

    const inviteFriendTitle = `${translator.getMessage('settings_free_gbs_invite_friend')} (${invitesCount}/${maxInvitesCount})`;

    const itemsData: RenderItemProps[] = [
        {
            title: inviteFriendTitle,
            status: translator.getMessage('settings_free_gbs_invite_friend_get_GB', { num: maxInvitesCount }),
            statusDone: translator.getMessage('settings_free_gbs_invite_friend_complete', { num: maxInvitesCount }),
            query: INVITE_FRIEND,
            completed: invitesQuestCompleted,
        },
        {
            title: translator.getMessage('settings_free_gbs_confirm_email_title'),
            status: translator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: translator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: CONFIRM_EMAIL,
            completed: confirmEmailQuestCompleted,
        },
        {
            title: translator.getMessage('settings_free_gbs_add_device_title'),
            status: translator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: translator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: ADD_DEVICE,
            completed: addDeviceQuestCompleted,
        },
    ];

    const renderItem = ({
        title,
        status,
        query,
        statusDone,
        completed,
    }: RenderItemProps) => {
        return (
            <Controls
                key={query}
                title={title}
                description={completed ? statusDone : status}
                className={classNames('free-gbs__button', completed && 'free-gbs__button--done')}
                beforeAction={<Icon name="checkmark" className="free-gbs__button-check-icon" />}
                action={<IconButton name="arrow-down" className="free-gbs__button-arrow-icon" />}
                onClick={() => clickItemHandler(query)}
            />
        );
    };

    if (query.has(INVITE_FRIEND)) {
        return <InviteFriend goBackHandler={goBackHandler} />;
    }

    if (query.has(CONFIRM_EMAIL)) {
        return <ConfirmEmail goBackHandler={goBackHandler} />;
    }

    if (query.has(ADD_DEVICE)) {
        return <AddDevice goBackHandler={goBackHandler} />;
    }

    if (bonusesDataRequestStatus !== RequestStatus.Done) {
        return <DotsLoader />;
    }

    return (
        <>
            <Title
                title={translator.getMessage('settings_free_gbs')}
                subtitle={translator.getMessage('settings_free_gbs_subtitle')}
            />
            {itemsData.map(renderItem)}
        </>
    );
});
