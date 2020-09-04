import React from 'react';

import BackButton from '../BackButton';
import Presentation from '../Presentation';

function WelcomeHeader() {
    return (
        <>
            <BackButton />
            <div className="auth__header">
                <Presentation />
            </div>
        </>
    );
}

export default WelcomeHeader;
