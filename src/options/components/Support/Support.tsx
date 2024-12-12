import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { getForwarderUrl } from '../../../common/helpers';
import { messenger } from '../../../common/messenger';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';

import { SupportItem } from './SupportItem';
import { BugReporter } from './BugReporter';

import './support.pcss';

export const Support = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { forwarderDomain, showBugReporter } = settingsStore;

    const faqUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FAQ);
    const handleClickFaq = async () => {
        await messenger.openTab(faqUrl);
    };

    const handleReportClick = (): void => {
        settingsStore.setShowBugReporter(true);
    };

    const feedbackUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FEEDBACK);
    const handleClickFeedback = async () => {
        await messenger.openTab(feedbackUrl);
    };

    if (showBugReporter) {
        return <BugReporter />;
    }

    return (
        <>
            <Title title={translator.getMessage('options_support_title')} />
            <SupportItem
                title={translator.getMessage('options_support_faq_title')}
                description={translator.getMessage('options_support_faq_description')}
                icon="question"
                onClick={handleClickFaq}
            />
            <SupportItem
                title={translator.getMessage('options_support_report_title')}
                description={translator.getMessage('options_support_report_description')}
                icon="bug"
                onClick={handleReportClick}
            />
            <SupportItem
                title={translator.getMessage('options_support_feedback_title')}
                description={translator.getMessage('options_support_feedback_description')}
                icon="send-feedback"
                onClick={handleClickFeedback}
            />
        </>
    );
});
