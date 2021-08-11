import React from 'react';
import { reactTranslator } from '../../../common/reactTranslator';

import './signedout.pcss';

export const SignedOut = () => {
    return (
        <div className="signedout">
            <div className="signedout__image" />
            <div className="signedout__title">
                {reactTranslator.getMessage('options_signedout_page_title')}
            </div>
            <div className="signedout__description">
                {reactTranslator.getMessage('options_signedout_page_description')}
            </div>
        </div>
    );
};
