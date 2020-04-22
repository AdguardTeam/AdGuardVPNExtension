import React from 'react';
import browser from 'webextension-polyfill';

import Popover from '../../ui/Popover';

const SubdomainsHelp = () => (
    <Popover>
        <>
            <div className="popover__title">
                {browser.i18n.getMessage('settings_exclusion_subdomains_title')}
            </div>
            <div className="popover__text">
                {browser.i18n.getMessage('settings_exclusion_subdomains_text')}
            </div>
        </>
    </Popover>
);

export default SubdomainsHelp;
