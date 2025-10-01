import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import {
    TelemetryScreenName,
    TelemetryActionName,
    type SupportItemClickActionNames,
} from '../../../background/telemetry/telemetryEnums';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { getForwarderUrl } from '../../../common/helpers';
import { messenger } from '../../../common/messenger';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { Icon, IconButton } from '../../../common/components/Icons';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { Controls } from '../ui/Controls';

import { BugReporter } from './BugReporter';

/**
 * Support items interface.
 */
interface SupportItems {
    /**
     * Title of item.
     */
    title: string;

    /**
     * Description of item.
     */
    description: React.ReactNode;

    /**
     * Icon name.
     */
    icon: string;

    /**
     * Click handler.
     */
    clickHandler: () => void;
}

/**
 * Support page component.
 */
export const Support = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);
    const { showBugReporter, setShowBugReporter, forwarderDomain } = settingsStore;

    // `SupportReportBugScreen` rendered on top of this screen
    const canSendTelemetry = !showBugReporter;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SupportScreen,
        canSendTelemetry,
    );

    const createOpenUrlHandler = (
        url: string,
        telemetryActionName: SupportItemClickActionNames,
    ) => async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            telemetryActionName,
            TelemetryScreenName.SupportScreen,
        );
        await messenger.openTab(url);
    };

    const handleReportClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ReportBugClick,
            TelemetryScreenName.SupportScreen,
        );
        setShowBugReporter(true);
    };

    const supportItemsData: SupportItems[] = [
        {
            title: translator.getMessage('options_support_faq_title'),
            description: translator.getMessage('options_support_faq_description'),
            icon: 'question',
            clickHandler: createOpenUrlHandler(
                getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FAQ),
                TelemetryActionName.FaqClick,
            ),
        }, {
            title: translator.getMessage('options_support_report_title'),
            description: translator.getMessage('options_support_report_description'),
            icon: 'bug',
            clickHandler: handleReportClick,
        }, {
            title: translator.getMessage('options_support_feedback_title'),
            description: translator.getMessage('options_support_feedback_description'),
            icon: 'send-feedback',
            clickHandler: createOpenUrlHandler(
                getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FEEDBACK),
                TelemetryActionName.LeaveFeedbackClick,
            ),
        },
    ];

    const renderSupportItem = ({
        title,
        description,
        icon,
        clickHandler,
    }: SupportItems): ReactElement => {
        return (
            <Controls
                key={title}
                title={title}
                description={description}
                beforeAction={<Icon name={icon} color="product" />}
                action={<IconButton name="arrow-down" rotation="clockwise" />}
                onClick={clickHandler}
            />
        );
    };

    if (showBugReporter) {
        return (
            <BugReporter />
        );
    }

    return (
        <>
            <Title title={translator.getMessage('options_support_title')} />
            <div className="support-items">
                {supportItemsData.map(renderSupportItem)}
            </div>
        </>
    );
});
