import React from 'react';

import { WEBSITE_URL, EULA_URL, PRIVACY_URL } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';

import './footer.pcss';

const getCurrentYear = () => new Date().getFullYear();

export const Footer = () => {
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
                        {reactTranslator.getMessage('eula')}
                    </a>
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={PRIVACY_URL}
                        className="footer__link"
                    >
                        {reactTranslator.getMessage('privacy_policy')}
                    </a>
                </nav>
            </div>
        </footer>
    );
};
