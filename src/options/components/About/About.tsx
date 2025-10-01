import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { translator } from '../../../common/translator';
import { getForwarderUrl } from '../../../common/helpers';
import { getPrivacyAndEulaUrls } from '../../../common/forwarderHelpers';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';

import './about.pcss';

/**
 * About page component.
 */
export const About = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.AboutScreen,
    );

    const { forwarderDomain } = settingsStore;

    const websiteUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.WEBSITE);
    const { eulaUrl, privacyUrl } = getPrivacyAndEulaUrls(forwarderDomain);

    const handleWebsiteClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OfficialWebClick,
            TelemetryScreenName.AboutScreen,
        );
    };

    const aboutVersionStr = `${translator.getMessage('account_version')} ${settingsStore.appVersion}`;

    const currentYear = new Date().getFullYear();
    const copyRightText = `© 2009-${currentYear} Adguard Software Ltd.`;

    return (
        <>
            <Title title={translator.getMessage('about_title')} />
            <div className="about">
                <div className="about__info">
                    <div className="about__info-name">
                        {translator.getMessage('short_name')}
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
                        {translator.getMessage('all_rights_reserved')}
                    </div>
                </div>
                <nav className="about__nav">
                    <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button has-tab-focus button--transparent about__link"
                        onClick={handleWebsiteClick}
                    >
                        <span className="button__text">
                            {translator.getMessage('official_website')}
                        </span>
                    </a>
                    <a
                        href={eulaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button has-tab-focus button--transparent about__link"
                    >
                        <span className="button__text">
                            {translator.getMessage('eula')}
                        </span>
                    </a>
                    <a
                        href={privacyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button has-tab-focus button--transparent about__link"
                    >
                        <span className="button__text">
                            {translator.getMessage('privacy_policy')}
                        </span>
                    </a>
                </nav>
            </div>
        </>
    );
});
