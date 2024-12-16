import React from 'react';

// import { translator } from '../../../common/translator';
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
                    {/* FIXME: Update translation text */}
                    {/* {translator.getMessage('options_signedout_page_title')} */}
                    You have logged out of AdGuard VPN
                </div>
                <div className="signedout__description">
                    {/* FIXME: Add translation text */}
                    {/* {translator.getMessage('options_signedout_page_description_not_secure')} */}
                    Your connection is not secured!
                    <br />
                    <br />
                    {/* FIXME: Updated translation text */}
                    {/* {translator.getMessage('options_signedout_page_description')} */}
                    To continue surfing privately, click the AdGuard VPN icon and log in again.
                </div>
                <Button className="signedout__btn account__action" onClick={handleGoHomeClick}>
                    {/* FIXME: Add translation text if needed */}
                    Go to home page
                </Button>
            </div>
        </div>
    );
}
