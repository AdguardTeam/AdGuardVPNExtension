import React from 'react';

import translator from '../../../../lib/translator/translator';
import './server-error.pcss';

const ServerError = ({ handleClick }) => {
    return (
        <div className="server-error">
            <div className="server-error__image" />
            <div className="server-error__title">
                {translator.translate('settings_not_responding')}
            </div>
            <button
                type="button"
                className="button button--medium button--green-gradient"
                onClick={handleClick}
            >
                {translator.translate('settings_choose_another')}
            </button>
        </div>
    );
};

export default ServerError;
