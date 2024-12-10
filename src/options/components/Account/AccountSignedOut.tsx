import React from 'react';

// import { translator } from '../../../common/translator';
import { Button } from '../ui/Button';

export function AccountSignedOut() {
    const handleGoHomeClick = () => {
        // FIXME: Implement if needed
    };

    return (
        <div className="account__signed-out">
            <div className="account__signed-out-content">
                <img
                    className="account__signed-out-image"
                    src="../../../assets/images/signed-out.svg"
                    alt="Floating Ninja"
                />
                <div className="account__signed-out-title">
                    {/* FIXME: Update translation text */}
                    {/* {translator.getMessage('options_signedout_page_title')} */}
                    You have logged out of AdGuard VPN
                </div>
                <div className="account__signed-out-description">
                    {/* FIXME: Add translation text */}
                    {/* {translator.getMessage('options_signedout_page_description_not_secure')} */}
                    Your connection is not secured!
                    <br />
                    <br />
                    {/* FIXME: Updated translation text */}
                    {/* {translator.getMessage('options_signedout_page_description')} */}
                    To continue surfing privately, click the AdGuard VPN icon and log in again.
                </div>
                <Button className="account__signed-out-btn account__action" onClick={handleGoHomeClick}>
                    {/* FIXME: Add translation text if needed */}
                    Go to home page
                </Button>
            </div>
        </div>
    );
}
