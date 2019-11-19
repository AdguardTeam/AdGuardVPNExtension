import React, { useContext } from 'react';
import browser from 'webextension-polyfill';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import './global-error.pcss';
import popupActions from '../../actions/popupActions';

const GlobalError = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleTryAgain = async () => {
        await settingsStore.checkPermissions();
    };

    const handleLearnMore = async () => {
        await popupActions.openVpnFailurePage();
    };

    return (
        <div className="global-error">
            <div className="global-error__content">
                <div className="global-error__icon" />
                <div className="global-error__title">
                    {browser.i18n.getMessage('global_error_title')}
                </div>
                <div className="global-error__description">
                    {browser.i18n.getMessage('global_error_description')}
                </div>
            </div>
            <div className="global-error__actions">
                <button
                    type="button"
                    className="button button--uppercase button--m button--green global-error__button"
                    onClick={handleLearnMore}
                >
                    {browser.i18n.getMessage('global_error_learn_more')}
                </button>
                <button
                    type="button"
                    className="button button--uppercase button--m button--link global-error__button"
                    onClick={handleTryAgain}
                >
                    {browser.i18n.getMessage('global_error_try_again')}
                </button>
            </div>
        </div>
    );
});

export default GlobalError;
