import React, {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import { ONE_MINUTE_MS } from '../../../common/constants';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import confirmEmailTaskImageUrl from '../../../assets/images/confirm-email.svg';
import { rootStore } from '../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';

const RESEND_COOLDOWN_KEY = 'resend.email.cooldown.start.time';

/**
 * Confirm email page component.
 */
export const ConfirmEmail = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const [isButtonCooldown, setIsButtonCooldown] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.FreeGbConfirmEmailScreen,
    );

    const { confirmBonus, resendConfirmationLink } = settingsStore;

    /**
     * Clears any existing timeouts to prevent memory leaks
     */
    const clearExistingTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }
    };

    /**
     * Sets up the cooldown timer based on stored timestamp
     */
    const setupCooldownTimer = () => {
        const cooldownStartTimeMs = Number(localStorage.getItem(RESEND_COOLDOWN_KEY));

        if (!cooldownStartTimeMs) {
            return;
        }

        const cooldownTimeLeftMs = cooldownStartTimeMs + ONE_MINUTE_MS - Date.now();

        if (cooldownTimeLeftMs > 0) {
            setIsButtonCooldown(true);

            timeoutRef.current = setTimeout(() => {
                setIsButtonCooldown(false);
                timeoutRef.current = undefined;
            }, cooldownTimeLeftMs);
        } else {
            // If cooldown has already expired, clean up localStorage
            localStorage.removeItem(RESEND_COOLDOWN_KEY);
        }
    };

    useEffect(() => {
        setupCooldownTimer();

        return () => {
            clearExistingTimeout();
        };
    }, []);

    const resendLink = async () => {
        localStorage.setItem(RESEND_COOLDOWN_KEY, Date.now().toString());
        setIsButtonCooldown(true);

        clearExistingTimeout();

        timeoutRef.current = setTimeout(() => {
            setIsButtonCooldown(false);
        }, ONE_MINUTE_MS);

        telemetryStore.sendCustomEvent(
            TelemetryActionName.ResendEmailClick,
            TelemetryScreenName.FreeGbConfirmEmailScreen,
        );

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
                src={confirmEmailTaskImageUrl}
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
