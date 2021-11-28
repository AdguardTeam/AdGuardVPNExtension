import React from 'react';

import { Popover } from '../../ui/Popover';
import { reactTranslator } from '../../../../common/reactTranslator';

const SubdomainsHelp = function () {
    return (
        <Popover>
            <>
                <div className="popover__title">
                    {reactTranslator.getMessage('settings_exclusion_subdomains_title')}
                </div>
                <div className="popover__text">
                    {reactTranslator.getMessage('settings_exclusion_subdomains_text')}
                </div>
            </>
        </Popover>
    );
};

export default SubdomainsHelp;
