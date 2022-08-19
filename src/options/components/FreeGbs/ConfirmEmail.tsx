import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';

export const ConfirmEmail = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const { confirmBonus, resendConfirmationLink } = settingsStore;

    const resendLink = async () => {
        await resendConfirmationLink();
        notificationsStore.notifySuccess(reactTranslator.getMessage('resend_confirm_registration_link_notification'));
    };

    const getContent = () => {
        if (confirmBonus.available) {
            return (
                <>
                    <Title title={reactTranslator.getMessage('settings_free_gbs_confirm_email_title')} />
                    <div className="free-gbs__info">
                        {reactTranslator.getMessage('settings_free_gbs_confirm_email_info', { your_gb: COMPLETE_TASK_BONUS_GB })}
                    </div>
                    <button
                        type="button"
                        className="button button--large button--outline-green free-gbs__button"
                        onClick={resendLink}
                    >
                        {reactTranslator.getMessage('settings_free_gbs_confirm_email_resend_link_button')}
                    </button>
                </>
            );
        }

        return (
            <>
                <Title title={reactTranslator.getMessage('confirm_email_done_title')} />
                <div className="free-gbs__info">{reactTranslator.getMessage('confirm_email_done_info')}</div>
                <button
                    type="button"
                    className="button button--large button--outline-gray free-gbs__button"
                    onClick={goBackHandler}
                >
                    {reactTranslator.getMessage('settings_free_gbs_go_back')}
                </button>
            </>
        );
    };

    return (
        <>
            <button
                className="free-gbs__back-button"
                type="button"
                onClick={goBackHandler}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#arrow" />
                </svg>
            </button>
            <div className="free-gbs__picture free-gbs__confirm-email-pic" />
            {getContent()}
        </>
    );
});
