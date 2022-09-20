import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { messenger } from '../../../lib/messenger';
import { FEEDBACK_URL, FAQ_URL } from '../../../background/config';
import { Title } from '../ui/Title';
import { BugReporter } from './BugReporter';
import { reactTranslator } from '../../../common/reactTranslator';

import './support.pcss';

export const Support = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showBugReporter, setShowBugReporter } = settingsStore;

    const createOpenUrlHandler = (url) => async () => {
        await messenger.openTab(url);
    };

    const handleReportClick = () => {
        setShowBugReporter(true);
    };

    const supportItemsData = [
        {
            title: reactTranslator.getMessage('options_support_faq_title'),
            description: reactTranslator.getMessage('options_support_faq_description'),
            iconXlink: '#question',
            clickHandler: createOpenUrlHandler(FAQ_URL),
        }, {
            title: reactTranslator.getMessage('options_support_report_title'),
            description: reactTranslator.getMessage('options_support_report_description'),
            iconXlink: '#bug',
            clickHandler: handleReportClick,
        }, {
            title: reactTranslator.getMessage('options_support_feedback_title'),
            description: reactTranslator.getMessage('options_support_feedback_description'),
            iconXlink: '#send-feedback',
            clickHandler: createOpenUrlHandler(FEEDBACK_URL),
        },
    ];

    const renderSupportItem = ({
        title,
        description,
        iconXlink,
        clickHandler,
    }) => {
        return (
            <li key={title} className="support-item" onClick={clickHandler}>
                <div className="support-item__area">
                    <svg className="icon icon--support">
                        <use xlinkHref={iconXlink} />
                    </svg>
                    <div className="support-item__info">
                        <div className="support-item__title">{title}</div>
                        <div className="support-item__description">{description}</div>
                    </div>
                </div>
                <svg className="icon icon--button">
                    <use xlinkHref="#arrow" />
                </svg>
            </li>
        );
    };

    if (showBugReporter) {
        return (
            <BugReporter />
        );
    }

    return (
        <>
            <Title title={reactTranslator.getMessage('options_support_title')} />
            <ul className="support-items">
                {supportItemsData.map(renderSupportItem)}
            </ul>
        </>
    );
});
