import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { translator } from '../../../common/translator';
import { Title } from '../ui/Title';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { RequestStatus, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';

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
    const query = new URLSearchParams(useLocation().search);

    const goBackHandler = () => {
        history.push(`/${FREE_GBS}`);
    };

    const clickItemHandler = (query: string) => {
        history.push(`/${FREE_GBS}?${query}`);
    };

    const inviteFriendTitle = `${translator.getMessage('settings_free_gbs_invite_friend')} (${invitesCount}/${maxInvitesCount})`;

    const itemsData = [
        {
            title: inviteFriendTitle,
            status: reactTranslator.getMessage('settings_free_gbs_invite_friend_get_GB', { num: maxInvitesCount }),
            statusDone: reactTranslator.getMessage('settings_free_gbs_invite_friend_complete', { num: maxInvitesCount }),
            query: INVITE_FRIEND,
            completed: invitesQuestCompleted,
        },
        {
            title: translator.getMessage('settings_free_gbs_confirm_email_title'),
            status: reactTranslator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: reactTranslator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: CONFIRM_EMAIL,
            completed: confirmEmailQuestCompleted,
        },
        {
            title: translator.getMessage('settings_free_gbs_add_device_title'),
            status: reactTranslator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: reactTranslator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
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
            <button
                type="button"
                key={title}
                className="free-gbs__item"
                onClick={() => clickItemHandler(query)}
            >
                <svg className="icon icon--button free-gbs__item--check-mark">
                    {
                        completed
                            ? <use xlinkHref="#check-mark-done" />
                            : <use xlinkHref="#check-mark" />
                    }
                </svg>
                <div>
                    <div className="free-gbs__item--title">{title}</div>
                    <div className="free-gbs__item--status">{completed ? statusDone : status}</div>
                </div>
                <svg className="icon icon--button free-gbs__item--arrow">
                    <use xlinkHref="#arrow" />
                </svg>
            </button>
        );
    };

    switch (true) {
        case query.has(INVITE_FRIEND): {
            return <InviteFriend goBackHandler={goBackHandler} />;
        }
        case query.has(CONFIRM_EMAIL): {
            return <ConfirmEmail goBackHandler={goBackHandler} />;
        }
        case query.has(ADD_DEVICE): {
            return <AddDevice goBackHandler={goBackHandler} />;
        }
        case bonusesDataRequestStatus !== RequestStatus.Done: {
            return <DotsLoader />;
        }
        default: {
            return (
                <>
                    <Title
                        title={reactTranslator.getMessage('settings_free_gbs')}
                        subtitle={reactTranslator.getMessage('settings_free_gbs_subtitle')}
                    />
                    {itemsData.map(renderItem)}
                </>
            );
        }
    }
});
