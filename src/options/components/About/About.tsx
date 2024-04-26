import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { getForwarderUrl } from '../../../common/helpers';
import { reactTranslator } from '../../../common/reactTranslator';

import './about.pcss';

export const About = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;

    const websiteUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.WEBSITE);
    const eulaUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.EULA);
    const privacyUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.PRIVACY);

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
                        href={websiteUrl}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('official_website')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={eulaUrl}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('eula')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={privacyUrl}
                        className="about__link"
                    >
                        {reactTranslator.getMessage('privacy_policy')}
                    </a>
                </nav>
            </div>
        </>
    );
});
