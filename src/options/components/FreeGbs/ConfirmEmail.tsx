import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import confirmEmailTaskImageUrl from '../../../assets/images/confirm-email.svg';
import { rootStore } from '../../stores';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { Button } from '../ui/Button';
import { Title } from '../ui/Title';

/**
 * Confirm email page component.
 */
export const ConfirmEmail = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.FreeGbConfirmEmailScreen,
    );

    const title = translator.getMessage('confirm_email_done_title_gb', { your_gb: COMPLETE_TASK_BONUS_GB });
    const description = translator.getMessage('confirm_email_done_info');

    const handleUpgrade = async (): Promise<void> => {
        await settingsStore.openPremiumPromoPage();
    };

    return (
        <div className="free-gbs-task">
            <Title
                className="free-gbs-task__back"
                title=""
                onClick={goBackHandler}
            />
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
                <Button
                    variant="filled"
                    size="medium"
                    onClick={handleUpgrade}
                    className="free-gbs-task__upgrade-btn"
                >
                    {translator.getMessage('settings_free_gbs_upgrade')}
                </Button>
            </div>
        </div>
    );
});
