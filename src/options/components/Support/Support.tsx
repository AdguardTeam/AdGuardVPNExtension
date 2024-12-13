import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { getForwarderUrl } from '../../../common/helpers';
import { messenger } from '../../../common/messenger';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { Icon, IconButton } from '../ui/Icon';
import { Controls } from '../ui/Controls';

import { BugReporter } from './BugReporter';

import './support.pcss';

interface SupportItems {
    title: string;
    description: React.ReactNode;
    icon: string;
    clickHandler: () => void;
}

export const Support = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showBugReporter, setShowBugReporter, forwarderDomain } = settingsStore;

    const createOpenUrlHandler = (url: string) => async (): Promise<void> => {
        await messenger.openTab(url);
    };

    const handleReportClick = (): void => {
        setShowBugReporter(true);
    };

    const supportItemsData: SupportItems[] = [
        {
            title: translator.getMessage('options_support_faq_title'),
            description: translator.getMessage('options_support_faq_description'),
            icon: 'question',
            clickHandler: createOpenUrlHandler(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FAQ)),
        }, {
            title: translator.getMessage('options_support_report_title'),
            description: translator.getMessage('options_support_report_description'),
            icon: 'bug',
            clickHandler: handleReportClick,
        }, {
            title: translator.getMessage('options_support_feedback_title'),
            description: translator.getMessage('options_support_feedback_description'),
            icon: 'send-feedback',
            clickHandler: createOpenUrlHandler(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FEEDBACK)),
        },
    ];

    const renderSupportItem = ({
        title,
        description,
        icon,
        clickHandler,
    }: SupportItems) => {
        return (
            <Controls
                key={title}
                title={title}
                description={description}
                beforeAction={<Icon name={icon} className="support__icon" />}
                action={<IconButton name="arrow-down" className="support__btn-icon" />}
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
