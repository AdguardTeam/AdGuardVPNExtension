import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import promoteSocialsImageUrl from '../../../assets/images/promote-socials.svg';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';
import { rootStore } from '../../stores';
import { Icon } from '../../../common/components/Icons';
import { Title } from '../ui/Title';
import { Button } from '../ui/Button';

/**
 * Maximum bonus GB that can be earned from promote socials task.
 */
const PROMOTE_SOCIALS_MAX_BONUS_GB = 3;

/**
 * Promote socials page component props.
 */
interface PromoteSocialsProps {
    /**
     * Handler for going back to the Free GBs list.
     */
    goBackHandler: () => void;
}

/**
 * Promote socials page component.
 */
export const PromoteSocials = observer(({ goBackHandler }: PromoteSocialsProps) => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.FreeGbPromoteSocialsScreen,
    );

    const handleButtonClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.GetSocialsBonusClick,
            TelemetryScreenName.FreeGbPromoteSocialsScreen,
        );
        await settingsStore.openPromoteSocialsPage();
    };

    const title = translator.getMessage('settings_free_gbs_promote_socials_title', {
        your_gb: COMPLETE_TASK_BONUS_GB,
    });

    const description = translator.getMessage('settings_free_gbs_promote_socials_info', {
        your_gb: COMPLETE_TASK_BONUS_GB,
        total_gb: PROMOTE_SOCIALS_MAX_BONUS_GB,
    });

    return (
        <div className="free-gbs-task">
            <Title
                className="free-gbs-task__back"
                title=""
                onClick={goBackHandler}
            />
            <img
                src={promoteSocialsImageUrl}
                alt={title}
                className="free-gbs-task__image"
            />
            <Title
                title={title}
                subtitle={description}
                className="free-gbs-task__title"
            />
            <div className="free-gbs-task__content promote-socials">
                <div className="promote-socials__button-wrapper">
                    <Button
                        variant="filled"
                        size="medium"
                        onClick={handleButtonClick}
                        className="promote-socials__button"
                    >
                        <Icon name="external-link" />
                        <span className="promote-socials__button-text">
                            {translator.getMessage('settings_free_gbs_promote_socials_button')}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
});
