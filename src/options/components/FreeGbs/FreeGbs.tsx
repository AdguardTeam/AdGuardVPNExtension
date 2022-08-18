import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { Referral } from './Referral';
import { ConfirmEmail } from './ConfirmEmail';
import { AddDevice } from './AddDevice';
import { Title } from '../ui/Title';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { REQUEST_STATUSES, COMPLETE_TASK_BONUS_GB } from '../../stores/consts';

import './free-gbs.pcss';

const FREE_GBS = 'free-gbs';

const REFERRAL_PROGRAM = 'referral-program';
const CONFIRM_EMAIL = 'confirm-email';
const ADD_DEVICE = 'add-device';

export const FreeGbs = observer(() => {
    const { settingsStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await settingsStore.updateReferralData();
        })();
    }, []);

    const {
        invitesCount,
        maxInvitesCount,
        referralDataRequestStatus,
    } = settingsStore;

    const history = useHistory();
    const query = new URLSearchParams(useLocation().search);

    const goBackHandler = () => {
        history.push(`/${FREE_GBS}`);
    };

    const clickItemHandler = (query: string) => {
        history.push(`/${FREE_GBS}?${query}`);
    };

    const referralProgramTitle = `${reactTranslator.getMessage('settings_free_gbs_invite_friend')} (${invitesCount}/${maxInvitesCount})`;

    const itemsData = [
        {
            title: referralProgramTitle,
            status: reactTranslator.getMessage('settings_free_gbs_invite_friend_get_GB', { num: maxInvitesCount }),
            statusDone: reactTranslator.getMessage('settings_free_gbs_invite_friend_complete', { num: maxInvitesCount }),
            query: REFERRAL_PROGRAM,
        },
        {
            title: reactTranslator.getMessage('settings_free_gbs_confirm_email_title'),
            status: reactTranslator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: reactTranslator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: CONFIRM_EMAIL,
        },
        {
            title: reactTranslator.getMessage('settings_free_gbs_add_device_title'),
            status: reactTranslator.getMessage('settings_free_gbs_get_GB', { num: COMPLETE_TASK_BONUS_GB }),
            statusDone: reactTranslator.getMessage('settings_free_gbs_task_complete', { num: COMPLETE_TASK_BONUS_GB }),
            query: ADD_DEVICE,
        },
    ];

    interface RenderItemArguments {
        title: string | React.ReactNode;
        status: string | React.ReactNode;
        query: string;
    }

    const renderItem = ({
        title,
        status,
        query,
    }: RenderItemArguments) => {
        return (
            <div className="free-gbs__item" onClick={() => clickItemHandler(query)}>
                <svg className="icon icon--button free-gbs__item--check-mark">
                    <use xlinkHref="#check-mark" />
                </svg>
                <div>
                    <div className="free-gbs__item--title">{title}</div>
                    <div className="free-gbs__item--status">{status}</div>
                </div>
                <svg className="icon icon--button free-gbs__item--arrow">
                    <use xlinkHref="#arrow" />
                </svg>
            </div>
        );
    };

    switch (true) {
        case query.has(REFERRAL_PROGRAM): {
            return <Referral goBackHandler={goBackHandler} />;
        }
        case query.has(CONFIRM_EMAIL): {
            return <ConfirmEmail goBackHandler={goBackHandler} />;
        }
        case query.has(ADD_DEVICE): {
            return <AddDevice goBackHandler={goBackHandler} />;
        }
        case referralDataRequestStatus !== REQUEST_STATUSES.DONE: {
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
