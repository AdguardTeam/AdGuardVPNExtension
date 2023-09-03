import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import {
    WEBSITE_URL,
    EULA_URL,
    PRIVACY_URL,
    VERSION_HISTORY_URL,
    DISCUSS_URL,
    ACKNOWLEDGMENTS_URL,
    GITHUB_URL,
} from '../../../background/config';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';

import './about.pcss';

export const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const aboutVersionStr = `${reactTranslator.getMessage('account_version')} ${settingsStore.appVersion}`;
    return (
        <>
            <Title title={reactTranslator.getMessage('about_title')} />
            <div className="about">
                <div className="about__header">
                    <div className="about__title">
                        {reactTranslator.getMessage('short_name')}
                    </div>
                    <div className="about__version">
                        {aboutVersionStr}
                    </div>
                </div>
                <nav className="about__nav">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={WEBSITE_URL}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('official_website')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={EULA_URL}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('eula')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={PRIVACY_URL}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('privacy_policy')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={VERSION_HISTORY_URL}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('version_history')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={DISCUSS_URL}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('discuss')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={ACKNOWLEDGMENTS_URL}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('acknowledgements')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={GITHUB_URL}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('github')}
                    </a>
                </nav>
            </div>
        </>
    );
});
