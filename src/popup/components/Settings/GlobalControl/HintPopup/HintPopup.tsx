import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';

import './hint-popup.pcss';

export const HintPopup = observer((): ReactElement => {
    const { authStore } = useContext(rootStore);

    const closeHint = async (): Promise<void> => {
        await authStore.closeHintPopup();
    };

    return (
        <div className="hint-popup">
            <div className="hint-popup__content">
                {reactTranslator.getMessage('popup_hint_popup_content')}
            </div>
            <button
                type="button"
                className="button button--simple-green hint-popup__button"
                onClick={closeHint}
            >
                {reactTranslator.getMessage('popup_hint_popup_button')}
            </button>
        </div>
    );
});
