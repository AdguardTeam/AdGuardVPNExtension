import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../../stores/consts';
import { Button } from '../../ui/Button';

import { type BaseProps, FreeGbsTask } from './FreeGbsTask';

export const ConfirmEmail = observer(({ onBackClick }: BaseProps) => {
    const { settingsStore, notificationsStore } = useContext(rootStore);
    const { confirmBonus } = settingsStore;

    const isCompleted = !confirmBonus.available;

    const title = isCompleted
        ? translator.getMessage('confirm_email_done_title')
        : translator.getMessage('settings_free_gbs_confirm_email_title');

    const description = isCompleted
        ? translator.getMessage('confirm_email_done_info')
        : translator.getMessage('settings_free_gbs_confirm_email_info', { your_gb: COMPLETE_TASK_BONUS_GB });

    const handleResendLink = async () => {
        await settingsStore.resendConfirmationLink();
        notificationsStore.notifySuccess(translator.getMessage('resend_confirm_registration_link_notification'));
    };

    return (
        <FreeGbsTask
            imageName="confirm-email-task.svg"
            title={title}
            description={description}
            contentClassName="confirm-email"
            completed={isCompleted}
            onBackClick={onBackClick}
        >
            <Button className="confirm-email__btn" onClick={handleResendLink}>
                {translator.getMessage('settings_free_gbs_confirm_email_resend_link_button')}
            </Button>
        </FreeGbsTask>
    );
});
