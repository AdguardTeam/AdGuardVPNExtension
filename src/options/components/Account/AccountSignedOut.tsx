import React from 'react';

import { Button } from '../ui/Button';

export function AccountSignedOut() {
    const handleClick = () => {
        // FIXME: Implement
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
                    {/* FIXME: Translation */}
                    You have logged out of AdGuard VPN
                </div>
                <div className="account__signed-out-description">
                    {/* FIXME: Translation */}
                    Your connection is not secured!
                    <br />
                    <br />
                    To continue surfing privately, click the AdGuard VPN icon and log in again.
                </div>
                <Button className="account__signed-out-btn" onClick={handleClick}>
                    Go to home page
                </Button>
            </div>
        </div>
    );
}
