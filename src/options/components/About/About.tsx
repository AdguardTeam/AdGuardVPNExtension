import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';
import { getForwarderUrl } from '../../../common/helpers';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';

import './about.pcss';

export const About = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { forwarderDomain } = settingsStore;

    const websiteUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.WEBSITE);
    const eulaUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.EULA);
    const privacyUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.PRIVACY);

    const aboutVersionStr = `${reactTranslator.getMessage('account_version')} ${settingsStore.appVersion}`;

    const currentYear = new Date().getFullYear();
    const copyRightText = `© 2009-${currentYear} AdGuard Software Ltd.`;

    return (
        <>
            <Title title={reactTranslator.getMessage('about_title')} />
            <div className="about__info">
                <div className="about__info-name">
                    {reactTranslator.getMessage('short_name')}
                </div>
                <div className="about__info-version">
                    {aboutVersionStr}
                </div>
            </div>
            <div className="about__copyright">
                <div className="about__copyright-item">
                    {copyRightText}
                </div>
                <div className="about__copyright-item">
                    {reactTranslator.getMessage('all_rights_reserved')}
                </div>
            </div>
            <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--medium button--ghost about__link"
            >
                {reactTranslator.getMessage('official_website')}
            </a>
            <a
                href={eulaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--medium button--ghost about__link"
            >
                {reactTranslator.getMessage('eula')}
            </a>
            <a
                href={privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button--medium button--ghost about__link"
            >
                {reactTranslator.getMessage('privacy_policy')}
            </a>
        </>
    );
});
