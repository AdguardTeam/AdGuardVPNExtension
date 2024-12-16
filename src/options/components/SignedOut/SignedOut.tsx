import React from 'react';

import { translator } from '../../../common/translator';
import { Button } from '../ui/Button';

import './signedout.pcss';

export function SignedOut() {
    const handleGoHomeClick = () => {
        // FIXME: Implement if needed
    };

    return (
        <div className="signedout">
            <div className="signedout__content">
                <img
                    className="signedout__image"
                    src="../../../assets/images/signedout.svg"
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
                <Button className="signedout__btn account__action" onClick={handleGoHomeClick}>
                    {/* FIXME: Add translation text if needed */}
                    Go to home page
                </Button>
            </div>
        </div>
    );
}
