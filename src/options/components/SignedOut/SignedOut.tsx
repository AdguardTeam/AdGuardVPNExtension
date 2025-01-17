import React from 'react';

import { translator } from '../../../common/translator';

import './signedout.pcss';

export function SignedOut() {
    return (
        <div className="signedout">
            <div className="signedout__content">
                <img
                    className="signedout__image"
                    src="../../../assets/images/signed-out.svg"
                    alt="Floating Ninja"
                />
                <div className="signedout__title">
                    {translator.getMessage('options_signedout_page_title')}
                </div>
                <div className="signedout__description">
                    {translator.getMessage('options_signedout_page_description_not_secure')}
                    <br />
                    <br />
                    {translator.getMessage('options_signedout_page_description')}
                </div>
            </div>
        </div>
    );
}
