import React from 'react';

import { reactTranslator } from '../../../../reactCommon/reactTranslator';

function MainHeader() {
    return (
        <div className="auth__header">
            <div className="auth__title">
                {reactTranslator.translate('short_name')}
            </div>
        </div>
    );
}

export default MainHeader;
