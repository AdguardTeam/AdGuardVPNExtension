import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';

import './confirm-email.pcss';

export const ConfirmEmailNotice = observer(() => {
    const { authStore } = useContext(rootStore);
    const { showConfirmEmailNotice, setShowConfirmEmailModal } = authStore;

    const showConfirmEmailModal = () => {
        setShowConfirmEmailModal(true);
    };

    if (!showConfirmEmailNotice) {
        return null;
    }

    return (
        <button
            type="button"
            className="confirm-email__notice"
            onClick={showConfirmEmailModal}
        >
            <svg className="icon icon--button">
                <use xlinkHref="#email" />
            </svg>
            {reactTranslator.getMessage('confirm_email_title')}
        </button>
    );
});
