import React from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
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
                    {reactTranslator.getMessage('options_signedout_page_title')}
                </div>
                <div className="account__signed-out-description">
                    {reactTranslator.getMessage('options_signedout_page_description_not_secure')}
                    <br />
                    <br />
                    {reactTranslator.getMessage('options_signedout_page_description')}
                </div>
                <Button className="account__signed-out-btn" onClick={handleClick}>
                    {/* FIXME: Add translation if button is needed */}
                    Go to home page
                </Button>
            </div>
        </div>
    );
}
