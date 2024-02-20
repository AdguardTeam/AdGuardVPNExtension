import React, { ReactNode, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { messenger } from '../../../common/messenger';
import { FEEDBACK_URL, FAQ_URL } from '../../../background/config';
import { Title } from '../ui/Title';
import { translator } from '../../../common/translator';

import { BugReporter } from './BugReporter';

import './support.pcss';

interface SupportItems {
    title: string;
    description: ReactNode;
    iconXlink: string;
    clickHandler: () => void;
}

export const Support = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showBugReporter, setShowBugReporter } = settingsStore;

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
            iconXlink: '#question',
            clickHandler: createOpenUrlHandler(FAQ_URL),
        }, {
            title: translator.getMessage('options_support_report_title'),
            description: translator.getMessage('options_support_report_description'),
            iconXlink: '#bug',
            clickHandler: handleReportClick,
        }, {
            title: translator.getMessage('options_support_feedback_title'),
            description: translator.getMessage('options_support_feedback_description'),
            iconXlink: '#send-feedback',
            clickHandler: createOpenUrlHandler(FEEDBACK_URL),
        },
    ];

    const renderSupportItem = ({
        title,
        description,
        iconXlink,
        clickHandler,
    }: SupportItems) => {
        return (
            <button
                type="button"
                key={title}
                className="support-item"
                onClick={clickHandler}
            >
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
            </button>
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
