import React from 'react';

import './server-error.pcss';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

const ServerError = ({ handleClick }) => {
    return (
        <div className="server-error">
            <div className="server-error__image" />
            <div className="server-error__title">
                {reactTranslator.translate('settings_not_responding')}
            </div>
            <button
                type="button"
                className="button button--medium button--green-gradient"
                onClick={handleClick}
            >
                {reactTranslator.translate('settings_choose_another')}
            </button>
        </div>
    );
};

export default ServerError;
