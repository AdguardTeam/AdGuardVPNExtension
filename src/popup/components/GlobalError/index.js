import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { reactTranslator } from '../../../common/reactTranslator';

import './global-error.pcss';

const GlobalError = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const ERROR_TYPES = {
        PERMISSION: 'permission',
        CONTROL: 'control',
    };

    const ICON_TYPES = {
        ERROR: 'error',
        TROUBLE: 'trouble',
    };

    const handleTryAgain = async () => {
        await settingsStore.checkPermissions();
    };

    const handleLearnMore = async () => {
        await popupActions.openVpnFailurePage();
    };

    const handleDisableExtensions = async (e) => {
        e.preventDefault();
        await settingsStore.disableOtherProxyExtensions();
    };

    let errorType = ERROR_TYPES.PERMISSION;

    if (settingsStore.hasGlobalError) {
        errorType = ERROR_TYPES.PERMISSION;
    }

    if (!settingsStore.canControlProxy) {
        errorType = ERROR_TYPES.CONTROL;
    }

    const errorsMap = {
        [ERROR_TYPES.CONTROL]: {
            description: reactTranslator.getMessage('control_error_description'),
            icon: ICON_TYPES.TROUBLE,
            buttons: [
                {
                    id: 1,
                    handler: handleDisableExtensions,
                    className: 'button button--medium button--green global-error__button',
                    text: reactTranslator.getMessage('control_error_disable'),
                },
            ],
        },
        [ERROR_TYPES.PERMISSION]: {
            title: reactTranslator.getMessage('global_error_title'),
            description: reactTranslator.getMessage('global_error_description'),
            icon: ICON_TYPES.ERROR,
            buttons: [
                {
                    id: 1,
                    handler: handleLearnMore,
                    text: reactTranslator.getMessage('global_error_learn_more'),
                    className: 'button button--medium button--green global-error__button',
                },
                {
                    id: 2,
                    handler: handleTryAgain,
                    className: 'button button--medium button--link global-error__button',
                    text: reactTranslator.getMessage('global_error_try_again'),
                },
            ],
        },
    };

    const {
        title, description, buttons, icon,
    } = errorsMap[errorType];

    const renderButtons = () => {
        return buttons.map((button) => {
            const {
                id,
                handler,
                className,
                text,
            } = button;

            return (
                <button
                    key={id}
                    type="button"
                    className={className}
                    onClick={handler}
                >
                    {text}
                </button>
            );
        });
    };

    return (
        <div className="global-error">
            <div className="global-error__content">
                <div className={`global-error__icon global-error__icon--${icon}`} />
                {title && (
                    <div className="global-error__title">
                        {title}
                    </div>
                )}
                <div className="global-error__description">
                    {description}
                </div>
            </div>
            <div className="global-error__actions">
                {renderButtons()}
            </div>
        </div>
    );
});

export default GlobalError;
