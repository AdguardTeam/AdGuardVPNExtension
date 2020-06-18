import React from 'react';

import Popover from '../../ui/Popover';
import translator from '../../../../lib/translator/translator';

const SubdomainsHelp = () => (
    <Popover>
        <>
            <div className="popover__title">
                {translator.translate('settings_exclusion_subdomains_title')}
            </div>
            <div className="popover__text">
                {translator.translate('settings_exclusion_subdomains_text')}
            </div>
        </>
    </Popover>
);

export default SubdomainsHelp;
