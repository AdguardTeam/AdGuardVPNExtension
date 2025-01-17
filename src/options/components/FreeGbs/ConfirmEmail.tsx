import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';

export const ConfirmEmail = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const { confirmBonus, resendConfirmationLink } = settingsStore;

    const resendLink = async () => {
        await resendConfirmationLink();
        notificationsStore.notifySuccess(translator.getMessage('resend_confirm_registration_link_notification'));
    };

    const isCompleted = !confirmBonus.available;

    const title = isCompleted
        ? translator.getMessage('confirm_email_done_title')
        : translator.getMessage('settings_free_gbs_confirm_email_title');

    const description = isCompleted
        ? translator.getMessage('confirm_email_done_info')
        : translator.getMessage('settings_free_gbs_confirm_email_info', { your_gb: COMPLETE_TASK_BONUS_GB });

    return (
        <div className="free-gbs-task">
            <Title title="" onClick={goBackHandler} />
            <img
                src="../../../assets/images/confirm-email-task.svg"
                alt={title}
                className="free-gbs-task__image"
            />
            <Title
                title={title}
                subtitle={description}
                className="free-gbs-task__title"
            />
            <div className="free-gbs-task__content confirm-email">
                {!isCompleted ? (
                    <Button
                        size="medium"
                        className="confirm-email__btn"
                        onClick={resendLink}
                    >
                        {translator.getMessage('settings_free_gbs_confirm_email_resend_link_button')}
                    </Button>
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
            </div>
        </div>
    );
});
