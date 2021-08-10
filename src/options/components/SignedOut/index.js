import React from 'react';
import './signedout.pcss';
import { reactTranslator } from '../../../common/reactTranslator';

const SignedOut = () => {
    return (
        <div className="signedout">
            <div className="signedout__ninja-image" />
            <div className="signedout__title">
                {reactTranslator.getMessage('signedout_page_title')}
            </div>
            <div className="signedout__description">
                {reactTranslator.getMessage('signedout_page_description')}
            </div>
        </div>
    );
};

export {
    SignedOut,
};
