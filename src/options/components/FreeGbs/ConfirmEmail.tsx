import React, {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import { ONE_MINUTE_MS } from '../../../common/constants';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry';
import { TelemetryScreenName } from '../../../background/telemetry';
import { rootStore } from '../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';

const RESEND_COOLDOWN_KEY = 'resend.email.countdown.start.time';

export const ConfirmEmail = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const [isButtonCooldown, setIsButtonCooldown] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.FreeGbConfirmEmailScreen,
    );

    const { confirmBonus, resendConfirmationLink } = settingsStore;

    useEffect(() => {
        const cooldownStartTimeMs = Number(sessionStorage.getItem(RESEND_COOLDOWN_KEY));

        if (!cooldownStartTimeMs) {
            return;
        }

        const cooldownTimeLeftMs = cooldownStartTimeMs + ONE_MINUTE_MS - Date.now();

        if (cooldownTimeLeftMs > 0) {
            setIsButtonCooldown(true);

            timeoutRef.current = setTimeout(() => {
                setIsButtonCooldown(false);
            }, cooldownTimeLeftMs);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const resendLink = async () => {
        sessionStorage.setItem(RESEND_COOLDOWN_KEY, Date.now().toString());
        setIsButtonCooldown(true);

        timeoutRef.current = setTimeout(() => {
            setIsButtonCooldown(false);
        }, ONE_MINUTE_MS);

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
                        disabled={isButtonCooldown}
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
