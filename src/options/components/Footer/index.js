import React from 'react';
import browser from 'webextension-polyfill';

import { WEBSITE_URL, EULA_URL, PRIVACY_URL } from '../../../background/config';
import './footer.pcss';

const getCurrentYear = () => new Date().getFullYear();

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__inner">
                <a href={WEBSITE_URL} className="footer__copyright">
                    &copy; AdGuard, 2009–
                    {getCurrentYear()}
                </a>
                <nav className="footer__nav">
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={EULA_URL}
                        className="footer__link"
                    >
                        {browser.i18n.getMessage('eula')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={PRIVACY_URL}
                        className="footer__link"
                    >
                        {browser.i18n.getMessage('privacy_policy')}
                    </a>
                </nav>
            </div>
        </footer>
    );
};

export default Footer;
