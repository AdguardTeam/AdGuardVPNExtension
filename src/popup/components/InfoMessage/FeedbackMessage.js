import React from 'react';
import { observer } from 'mobx-react';

import './info-message.pcss';
import popupActions from '../../actions/popupActions';
import { POPUP_FEEDBACK_URL } from '../../../background/config';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const InfoMessage = observer(() => {
    const handleClick = () => {
        popupActions.openTab(POPUP_FEEDBACK_URL);
    };

    return (
        <div className="info-message info-message--feedback">
            <div className="info-message__text">
                {reactTranslator.translate('popup_feedback_title')}
            </div>
            <button
                type="button"
                className="button button--medium button--outline-white info-message__btn info-message__btn--feedback"
                onClick={handleClick}
            >
                {reactTranslator.translate('popup_feedback_button')}
            </button>
        </div>
    );
});

export default InfoMessage;
