import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { Title } from '../ui/Title';
import { COMPLETE_TASK_BONUS_GB } from '../../stores/consts';

export const ConfirmEmail = observer(({ goBackHandler }: { goBackHandler: () => void }) => {
    const { settingsStore } = useContext(rootStore);

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
                {reactTranslator.getMessage('settings_free_gbs_confirm_email_info', { your_gb: COMPLETE_TASK_BONUS_GB })}
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
