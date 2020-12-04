import React, { useState } from 'react';

import messenger from '../../../lib/messenger';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { FEEDBACK_URL } from '../../../background/config';
import { Title } from '../ui/Title';

import './support.pcss';
import { BugReporter } from './BugReporter';

export const Support = () => {
    const [displayReportBug, setDisplayReportBug] = useState(false);

    const createOpenUrlHandler = (url) => async () => {
        await messenger.openTab(url);
    };

    const handleReportClick = () => {
        setDisplayReportBug(true);
    };

    const supportItemsData = [
        {
            title: reactTranslator.translate('options_support_faq_title'),
            description: reactTranslator.translate('options_support_faq_description'),
            iconXlink: '#question',
            clickHandler: createOpenUrlHandler('https://adguard-vpn.com/en/welcome.html'), // FIXME wrap url in the tds
        }, {
            title: reactTranslator.translate('options_support_report_title'),
            description: reactTranslator.translate('options_support_report_description'),
            iconXlink: '#bug',
            clickHandler: handleReportClick,
        }, {
            title: reactTranslator.translate('options_support_feedback_title'),
            description: reactTranslator.translate('options_support_feedback_description'),
            iconXlink: '#send-feedback',
            clickHandler: createOpenUrlHandler(FEEDBACK_URL),
        }, {
            title: reactTranslator.translate('options_support_discuss_title'),
            description: reactTranslator.translate('options_support_discuss_description'),
            iconXlink: '#chat',
            clickHandler: createOpenUrlHandler('https://adguard.com/en/discuss.html'), // FIXME wrap url in the tds
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

    // FIXME remove true
    if (true || displayReportBug) {
        return (
            <BugReporter
                closeHandler={() => {
                    setDisplayReportBug(false);
                }}
            />
        );
    }

    return (
        <>
            <Title title={reactTranslator.translate('options_support_title')} />
            <ul className="support-items">
                {supportItemsData.map(renderSupportItem)}
            </ul>
        </>
    );
};
