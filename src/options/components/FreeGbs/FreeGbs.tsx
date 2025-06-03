import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import { translator } from '../../../common/translator';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { Icon, IconButton } from '../../../common/components/Icons';
import {
    TelemetryActionName,
    TelemetryScreenName,
    type FreeGbItemClickActionNames,
} from '../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../stores';
import { RequestStatus, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Title } from '../ui/Title';
import { Controls } from '../ui/Controls';

import { InviteFriend } from './InviteFriend';
import { ConfirmEmail } from './ConfirmEmail';
import { AddDevice } from './AddDevice';

import './free-gbs.pcss';

/**
 * Free GBs page component props.
 */
interface RenderItemProps {
    /**
     * Item title.
     */
    title: string;

    /**
     * Item status.
     */
    status: string | React.ReactNode;

    /**
     * Item query.
     */
    query: string;

    /**
     * Item status when completed.
     */
    statusDone: string | React.ReactNode;

    /**
     * Is item completed.
     */
    completed: boolean;

    /**
     * Telemetry action name.
     */
    telemetryActionName: FreeGbItemClickActionNames;
}

/**
 * Free GBs page route.
 */
const FREE_GBS = 'free-gbs';

/**
 * Free GBs invite friend page query.
 */
const INVITE_FRIEND = 'invite-friend';

/**
 * Free GBs confirm email page query.
 */
const CONFIRM_EMAIL = 'confirm-email';

/**
 * Free GBs add device page query.
 */
const ADD_DEVICE = 'add-device';

/**
 * Free GBs page component.
 */
export const FreeGbs = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

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

    const isInviteFriendPage = query.has(INVITE_FRIEND);
    const isConfirmEmailPage = query.has(CONFIRM_EMAIL);
    const isAddDevicePage = query.has(ADD_DEVICE);
    const isLoading = bonusesDataRequestStatus !== RequestStatus.Done;

    const canSendTelemetry = !isInviteFriendPage // `FreeGbInviteFriendScreen` is rendered on top of this screen
        && !isConfirmEmailPage // `FreeGbConfirmEmailScreen` is rendered on top of this screen
        && !isAddDevicePage; // `FreeGbAddAnotherPlatformScreen` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.FreeGbScreen,
        canSendTelemetry,
    );

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
            telemetryActionName: TelemetryActionName.InviteFriendClick,
        },
        {
            title: translator.getMessage('settings_free_gbs_confirm_email_title'),
            status: translator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: translator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: CONFIRM_EMAIL,
            completed: confirmEmailQuestCompleted,
            telemetryActionName: TelemetryActionName.ConfirmEmailClick,
        },
        {
            title: translator.getMessage('settings_free_gbs_add_device_title'),
            status: translator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: translator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: ADD_DEVICE,
            completed: addDeviceQuestCompleted,
            telemetryActionName: TelemetryActionName.AddGbDeviceClick,
        },
    ];

    const renderItem = ({
        title,
        status,
        query,
        statusDone,
        completed,
        telemetryActionName,
    }: RenderItemProps) => {
        const handleClick = () => {
            telemetryStore.sendCustomEvent(
                telemetryActionName,
                TelemetryScreenName.FreeGbScreen,
            );
            clickItemHandler(query);
        };

        return (
            <Controls
                key={query}
                title={title}
                description={completed ? statusDone : status}
                className="free-gbs__button"
                beforeAction={<Icon name="checkmark" color={completed ? 'product' : 'gray'} />}
                action={<IconButton name="arrow-down" rotation="clockwise" />}
                onClick={handleClick}
            />
        );
    };

    if (isInviteFriendPage) {
        return <InviteFriend goBackHandler={goBackHandler} />;
    }

    if (isConfirmEmailPage) {
        return <ConfirmEmail goBackHandler={goBackHandler} />;
    }

    if (isAddDevicePage) {
        return <AddDevice goBackHandler={goBackHandler} />;
    }

    if (isLoading) {
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
