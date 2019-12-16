import React from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import './info-message.pcss';
import popupActions from '../../actions/popupActions';
import { POPUP_FEEDBACK_URL } from '../../../background/config';

const InfoMessage = observer(() => {
    const handleClick = () => {
        popupActions.openTab(POPUP_FEEDBACK_URL);
    };

    return (
        <div className="info-message">
            <div className="info-message__info">
                {browser.i18n.getMessage('popup_feedback_title')}
            </div>
            <button
                type="button"
                className="info-message__btn button button--green"
                onClick={handleClick}
            >
                {browser.i18n.getMessage('popup_feedback_button')}
            </button>
        </div>
    );
});

export default InfoMessage;
