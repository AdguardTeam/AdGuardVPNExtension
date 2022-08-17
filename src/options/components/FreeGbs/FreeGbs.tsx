import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory, useLocation } from 'react-router-dom';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { Referral } from './Referral';
import { ConfirmEmail } from './ConfirmEmail';
import { AddDevice } from './AddDevice';
import { Title } from '../ui/Title';

import './free-gbs.pcss';

export const FreeGbs = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const history = useHistory();
    const query = new URLSearchParams(useLocation().search);

    const goBackHandler = () => {
        history.push('/free-gbs');
    };

    const clickHandler = (query: string) => {
        history.push(`/free-gbs?${query}`);
    };

    if (query.has('referral-program')) {
        return (
            <Referral goBackHandler={goBackHandler} />
        );
    }

    if (query.has('confirm-email')) {
        return (
            <ConfirmEmail goBackHandler={goBackHandler} />
        );
    }

    if (query.has('add-device')) {
        return (
            <AddDevice goBackHandler={goBackHandler} />
        );
    }

    const itemsData = [
        {
            title: reactTranslator.getMessage('settings_free_gbs_invite_friend'),
            status: 'Get up to 5 GB',
            statusDone: 'You got 5 GB',
            query: 'referral-program',
        },
        {
            title: reactTranslator.getMessage('settings_free_gbs_confirm_email_title'),
            status: 'Get 1 GB',
            statusDone: 'You got 1 GB',
            query: 'confirm-email',
        },
        {
            title: reactTranslator.getMessage('settings_free_gbs_add_device_title'),
            status: 'Get 1 GB',
            statusDone: 'You got 1 GB',
            query: 'add-device',
        },
    ];

    const renderItem = ({
        title,
        status,
        query,
    }: { title: string, status: string, query: string }) => {
        return (
            <div className="free-gbs__item" onClick={() => clickHandler(query)}>
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

    return (
        <>
            <Title
                title={reactTranslator.getMessage('settings_free_gbs')}
                subtitle={reactTranslator.getMessage('settings_free_gbs_subtitle')}
            />
            {itemsData.map(renderItem)}
        </>
    );
});
