import React from 'react';
import translator from '../../../../lib/translator';

function MainHeader() {
    return (
        <div className="auth__header">
            <div className="auth__title">
                {translator.translate('short_name')}
            </div>
        </div>
    );
}

export default MainHeader;
