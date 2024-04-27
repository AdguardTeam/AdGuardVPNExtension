import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';
import { getForwarderUrl } from '../../../common/helpers';

import './info-message.pcss';

export const FeedbackMessage = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { forwarderDomain } = settingsStore;

    const handleClick = (): void => {
        popupActions.openTab(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.POPUP_FEEDBACK));
    };

    return (
        <div className="info-message info-message--feedback">
            <div className="info-message__text">
                {reactTranslator.getMessage('popup_feedback_title')}
            </div>
            <button
                type="button"
                className="button button--medium button--outline-white info-message__btn info-message__btn--feedback"
                onClick={handleClick}
            >
                {reactTranslator.getMessage('popup_feedback_button')}
            </button>
        </div>
    );
});
