import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';

const CONFIRM_EMAIL_RECEIVE_GB = 1;

export const ConfirmEmail = observer(() => {
    const { settingsStore } = useContext(rootStore);

    // const { isPremiumToken } = settingsStore;
    const history = useHistory();

    const goBackHandler = () => {
        history.push('/free-gbs');
    };

    return (
        <div>
            <button
                className="free-gbs__back-button"
                type="button"
                onClick={goBackHandler}
            >
                <svg className="icon icon--button">
                    <use xlinkHref="#arrow" />
                </svg>
            </button>
            <div className="free-gbs__picture free-gbs__confirm-email-pic" />
            <Title title={reactTranslator.getMessage('settings_free_gbs_confirm_email_title')} />
            <div className="free-gbs__info">
                {reactTranslator.getMessage('settings_free_gbs_confirm_email_info', { your_gb: CONFIRM_EMAIL_RECEIVE_GB })}
            </div>
            <button
                type="button"
                className="button button--large button--outline-green free-gbs__button"
            >
                {reactTranslator.getMessage('settings_free_gbs_confirm_email_resend_link_button')}
            </button>
        </div>
    );
});
