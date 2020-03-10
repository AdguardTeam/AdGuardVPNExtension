import React from 'react';
import translator from '../../../../lib/translator';

function MainHeader() {
    return (
        <div className="auth__header auth__header--main">
            <svg className="icon auth__beta">
                <use xlinkHref="#beta" />
            </svg>

            {translator.translate('short_name')}
        </div>
    );
}

export default MainHeader;
